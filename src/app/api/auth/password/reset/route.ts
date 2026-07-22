import { NextRequest } from "next/server";
import crypto from "crypto";
import { execute, queryRow, formatDateForMySQL } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { sendEmailOTP } from "@/lib/email";
import { corsHeaders, handleCorsOptions, jsonWithCors } from "@/lib/cors";
import { enforceRateLimit } from "@/lib/rate-limit";

function generateOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(otp: string): string {
    return crypto.createHash("sha256").update(otp).digest("hex");
}

export async function OPTIONS() {
    return handleCorsOptions();
}

// POST: Request OTP for password reset
export async function POST(request: NextRequest) {
    try {
        const rateLimit = enforceRateLimit(request, "auth-password-reset", 3, 60_000);
        if (!rateLimit.allowed) {
            return jsonWithCors(
                { message: "Terlalu banyak percobaan reset password. Coba lagi dalam 1 menit." },
                { status: 429 }
            );
        }
        const { email } = await request.json();

        if (!email) {
            return jsonWithCors(
                { message: "Email wajib diisi." },
                { status: 400 }
            );
        }

        const user = await queryRow<{ id: number; name: string; email: string }>(
            "SELECT id, name, email FROM users WHERE email = ? LIMIT 1",
            [email]
        );

        if (!user) {
            // Return generic success to prevent email enumeration
            return jsonWithCors({
                message: "Kode OTP reset telah dikirim ke email Anda jika terdaftar.",
            });
        }

        const otp = generateOtp();
        const hashedOtp = hashOtp(otp);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 menit

        await execute("DELETE FROM otp_attempts WHERE email = ?", [email]);
        try {
            await execute(
                "INSERT INTO otp_attempts (email, otp_hash, type, expires_at) VALUES (?, ?, ?, ?)",
                [email, hashedOtp, "reset", formatDateForMySQL(expiresAt)]
            );
        } catch {
            await execute(
                "ALTER TABLE otp_attempts MODIFY COLUMN type ENUM('register', 'login', 'reset') NOT NULL DEFAULT 'login'"
            ).catch(() => {});
            await execute(
                "INSERT INTO otp_attempts (email, otp_hash, type, expires_at) VALUES (?, ?, ?, ?)",
                [email, hashedOtp, "login", formatDateForMySQL(expiresAt)]
            );
        }

        const emailResult = await sendEmailOTP(email, otp, "reset");
        if (!emailResult.success && process.env.NODE_ENV === "production") {
            return jsonWithCors(
                { message: "Gagal mengirim OTP reset ke email. Silakan coba lagi." },
                { status: 500 }
            );
        }

        return jsonWithCors({
            message: "Kode OTP reset telah dikirim ke alamat email Anda.",
        });
    } catch (error: any) {
        console.error("Error asking for reset OTP:", error);
        return jsonWithCors(
            { message: "Terjadi kesalahan pada server." },
            { status: 500 }
        );
    }
}

// PATCH: Verify OTP only (Step 2 check before moving to new password screen)
export async function PATCH(request: NextRequest) {
    try {
        const rateLimit = enforceRateLimit(request, "auth-password-verify", 10, 60_000);
        if (!rateLimit.allowed) {
            return jsonWithCors(
                { message: "Terlalu banyak percobaan verifikasi. Coba lagi dalam 1 menit." },
                { status: 429 }
            );
        }

        const { email, otp } = await request.json();

        if (!email || !otp) {
            return jsonWithCors(
                { message: "Email dan Kode OTP wajib diisi." },
                { status: 400 }
            );
        }

        const hashedInputOtp = hashOtp(otp);

        const record = await queryRow<{ id: number; expires_at: string }>(
            "SELECT id, expires_at FROM otp_attempts WHERE email = ? AND otp_hash = ? AND (type = 'reset' OR type = 'login') ORDER BY created_at DESC LIMIT 1",
            [email, hashedInputOtp]
        );

        if (!record) {
            return jsonWithCors(
                { message: "Kode OTP salah. Silakan periksa kembali email Anda." },
                { status: 400 }
            );
        }

        if (new Date() > new Date(record.expires_at)) {
            return jsonWithCors(
                { message: "Kode OTP sudah kedaluwarsa. Silakan minta kode baru." },
                { status: 400 }
            );
        }

        return jsonWithCors({ message: "Kode OTP valid." });
    } catch (error: any) {
        console.error("Error verifying OTP:", error);
        return jsonWithCors(
            { message: "Terjadi kesalahan server saat verifikasi OTP." },
            { status: 500 }
        );
    }
}

// PUT: Verify OTP and set new password
export async function PUT(request: NextRequest) {
    try {
        const rateLimit = enforceRateLimit(request, "auth-password-verify", 10, 60_000);
        if (!rateLimit.allowed) {
            return jsonWithCors(
                { message: "Terlalu banyak percobaan verifikasi. Coba lagi dalam 1 menit." },
                { status: 429 }
            );
        }

        const { email, otp, password } = await request.json();

        if (!email || !otp || !password) {
            return jsonWithCors(
                { message: "Email, OTP, dan password baru wajib diisi." },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return jsonWithCors(
                { message: "Password minimal 6 karakter." },
                { status: 400 }
            );
        }

        const hashedInputOtp = hashOtp(otp);

        const record = await queryRow<{ id: number; expires_at: string }>(
            "SELECT id, expires_at FROM otp_attempts WHERE email = ? AND otp_hash = ? AND (type = 'reset' OR type = 'login') ORDER BY created_at DESC LIMIT 1",
            [email, hashedInputOtp]
        );

        if (!record) {
            return jsonWithCors(
                { message: "Kode OTP salah atau tidak ditemukan." },
                { status: 400 }
            );
        }

        if (new Date() > new Date(record.expires_at)) {
            return jsonWithCors(
                { message: "Kode OTP sudah kedaluwarsa. Silakan minta ulang." },
                { status: 400 }
            );
        }

        const passwordHash = await hashPassword(password);

        // Fetch existing user to check if the new password is the same as the current one
        const user = await queryRow<{ password_hash: string }>(
            "SELECT password_hash FROM users WHERE email = ? LIMIT 1",
            [email]
        );

        if (user && user.password_hash) {
            const isSamePassword = await verifyPassword(password, user.password_hash);
            if (isSamePassword) {
                return jsonWithCors(
                    { message: "Kata sandi baru tidak boleh sama dengan kata sandi saat ini." },
                    { status: 400 }
                );
            }
        }
        
        await execute(
            "UPDATE users SET password_hash = ? WHERE email = ?",
            [passwordHash, email]
        );

        // Hapus OTP setelah berhasil digunakan
        await execute("DELETE FROM otp_attempts WHERE id = ?", [record.id]);

        return jsonWithCors({ message: "Password berhasil diubah. Silakan login." });
    } catch (error: any) {
        console.error("Error resetting password:", error);
        return jsonWithCors(
            { message: "Terjadi kesalahan pada server." },
            { status: 500 }
        );
    }
}
