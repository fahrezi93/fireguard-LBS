import { NextRequest } from "next/server";
import { execute, queryRow } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { sendWhatsAppOTP } from "@/lib/whatsapp";
import crypto from "crypto";
import { corsHeaders, handleCorsOptions, jsonWithCors } from "@/lib/cors";

function generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashOtp(otp: string): string {
    return crypto.createHash("sha256").update(otp).digest("hex");
}

function formatDateForMySQL(date: Date): string {
    return date.toISOString().slice(0, 19).replace("T", " ");
}

export async function OPTIONS() {
    return handleCorsOptions();
}

// POST: Request OTP for password reset (also used by old users to set password)
export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return jsonWithCors(
                { message: "Email wajib diisi." },
                { status: 400 }
            );
        }

        const user = await queryRow<{ id: number; name: string; phone_number: string }>(
            "SELECT id, name, phone_number FROM users WHERE email = ? LIMIT 1",
            [email]
        );

        if (!user || !user.phone_number) {
            // We return success anyway to prevent email enumeration
            return jsonWithCors({
                message: `Kode reset telah dikirim ke WhatsApp Anda jika akun tersebut terdaftar.`,
            });
        }

        const otp = generateOtp();
        const hashedOtp = hashOtp(otp);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 menit

        await execute("DELETE FROM otp_attempts WHERE email = ?", [email]);
        await execute(
            "INSERT INTO otp_attempts (email, otp_hash, type, expires_at) VALUES (?, ?, ?, ?)",
            [email, hashedOtp, "login", formatDateForMySQL(expiresAt)]
        );

        const waResult = await sendWhatsAppOTP(user.phone_number, otp, "reset");
        if (!waResult.success) {
            if (process.env.NODE_ENV !== "production") {
                return jsonWithCors({
                    message:
                        "Kode reset sudah dibuat. WhatsApp belum aktif di server dev, cek OTP di log server.",
                });
            }

            return jsonWithCors(
                { message: "Gagal mengirim OTP reset ke WhatsApp. Silakan coba lagi." },
                { status: 500 }
            );
        }

        return jsonWithCors({
            message: `Kode reset telah dikirim ke WhatsApp Anda`,
        });
    } catch (error: any) {
        console.error("Error asking for reset OTP:", error);
        return jsonWithCors(
            { message: "Terjadi kesalahan pada server." },
            { status: 500 }
        );
    }
}

// PUT: Verify OTP and set new password
export async function PUT(request: NextRequest) {
    try {
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
            "SELECT id, expires_at FROM otp_attempts WHERE email = ? AND otp_hash = ? AND type = 'login' ORDER BY created_at DESC LIMIT 1",
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
        
        await execute(
            "UPDATE users SET password_hash = ?, updated_at = NOW() WHERE email = ?",
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
