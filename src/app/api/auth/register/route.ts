import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { execute, queryRow, formatDateForMySQL } from "@/lib/db";
import { hashOtp } from "@/lib/auth";
import { sendWhatsAppOTP } from "@/lib/whatsapp";
import { sendEmailOTP } from "@/lib/email";
import { handleCorsOptions, jsonWithCors } from "@/lib/cors";
import { enforceRateLimit } from "@/lib/rate-limit";
import { ensureNotificationTables } from "@/lib/db-init";

function generateOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
}

export async function OPTIONS() {
    return handleCorsOptions();
}

// POST: Kirim OTP untuk registrasi
export async function POST(request: NextRequest) {
    try {
        await ensureNotificationTables();

        const limit = enforceRateLimit(request, "auth-register-send", 10, 60_000);
        if (!limit.allowed) {
            return jsonWithCors(
                { message: "Terlalu banyak permintaan OTP registrasi. Coba lagi nanti." },
                { status: 429, headers: { "Retry-After": String(limit.retryAfter) }, request }
            );
        }

        const { name, email, phoneNumber } = await request.json();

        // Validasi input
        if (!name || !email || !phoneNumber) {
            return jsonWithCors({ message: "Nama, email, dan nomor WhatsApp wajib diisi." }, { status: 400 });
        }

        // Validasi format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return jsonWithCors({ message: "Format email tidak valid." }, { status: 400 });
        }

        // Cek apakah email sudah terdaftar
        const existingUser = await queryRow<{ id: number }>(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existingUser) {
            return jsonWithCors({ message: "Email ini sudah terdaftar. Silakan masuk menggunakan akun Anda." }, { status: 400 });
        }

        // Generate OTP
        const otp = generateOtp();
        const hashedOtp = hashOtp(otp);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 menit

        // Hapus OTP lama untuk email ini
        await execute("DELETE FROM otp_attempts WHERE email = ?", [email]);

        // Simpan OTP baru
        await execute(
            "INSERT INTO otp_attempts (email, otp_hash, type, expires_at) VALUES (?, ?, ?, ?)",
            [email, hashedOtp, "register", formatDateForMySQL(expiresAt)]
        );

        // Kirim OTP via WhatsApp
        const waResult = await sendWhatsAppOTP(phoneNumber, otp, "register");

        if (!waResult.success) {
            console.log(`[Register] WhatsApp gagal untuk ${phoneNumber}. Mencoba Fallback Email ke ${email}...`);
            const emailResult = await sendEmailOTP(email, otp);
            
            if (!emailResult.success) {
                return jsonWithCors({ message: "Gagal mengirim OTP ke WhatsApp maupun Email. Pastikan nomor atau email Anda aktif." }, { status: 500 });
            }

            return jsonWithCors({
                message: `Kode OTP berhasil dikirim ke Email ${email}. Silakan cek kotak masuk atau folder spam Anda.`,
                tempData: { name, email, phoneNumber },
            });
        }

        return jsonWithCors({
            message: `Kode OTP berhasil dikirim ke WhatsApp ${phoneNumber}`,
            tempData: { name, email, phoneNumber },
        });
    } catch (error: any) {
        console.error("Error in register:", error);
        return jsonWithCors({ message: "Terjadi kesalahan pada server." }, { status: 500 });
    }
}
