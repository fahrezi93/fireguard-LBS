import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { queryRow, execute, formatDateForMySQL } from "@/lib/db";
import { hashOtp } from "@/lib/auth";
import { sendWhatsAppOTP } from "@/lib/whatsapp";
import { corsHeaders, handleCorsOptions, jsonWithCors } from "@/lib/cors";
import { enforceRateLimit } from "@/lib/rate-limit";

// OPTIONS: CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

// POST: Kirim OTP WhatsApp untuk login
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 permintaan per 60 detik per IP
    const limit = enforceRateLimit(request, "whatsapp-login-send", 5, 60_000);
    if (!limit.allowed) {
      return jsonWithCors(
        { message: "Terlalu banyak permintaan OTP. Coba lagi nanti." },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfter) },
          request,
        },
      );
    }

    const body = await request.json();
    const { phone_number } = body;

    // Validasi input
    if (
      !phone_number ||
      typeof phone_number !== "string" ||
      phone_number.trim() === ""
    ) {
      return jsonWithCors(
        { message: "Nomor HP wajib diisi." },
        { status: 400, request },
      );
    }

    // Format nomor telepon ke format internasional (62xxx) dan alternatif (0xxx)
    let formattedPhone = phone_number.replace(/\D/g, "");
    let altPhone = "";

    if (formattedPhone.startsWith("0")) {
      altPhone = formattedPhone;
      formattedPhone = "62" + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith("62")) {
      altPhone = "0" + formattedPhone.substring(2);
    } else if (formattedPhone.startsWith("8")) {
      altPhone = "0" + formattedPhone;
      formattedPhone = "62" + formattedPhone;
    }

    // Cek apakah nomor HP terdaftar di database (cari kedua format)
    const user = await queryRow<{
      id: number;
      name: string;
      email: string;
      phone_number: string;
    }>(
      "SELECT id, name, email, phone_number FROM users WHERE phone_number = ? OR phone_number = ?",
      [formattedPhone, altPhone],
    );

    if (!user) {
      return jsonWithCors(
        {
          message:
            "Nomor HP tidak terdaftar. Pastikan nomor yang digunakan sudah benar dan terdaftar di sistem.",
        },
        { status: 404, request },
      );
    }

    // Generate OTP 6 digit acak
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = hashOtp(otp);

    // Hapus OTP lama untuk nomor ini agar tidak menumpuk
    await execute(
      "DELETE FROM otp_attempts WHERE email = ? AND type = 'login'",
      [formattedPhone],
    );

    // Simpan OTP baru dengan waktu kadaluwarsa 10 menit (menggunakan waktu server aplikasi untuk menghindari clock drift)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const expiresAtFormatted = formatDateForMySQL(expiresAt);

    await execute(
      "INSERT INTO otp_attempts (email, otp_hash, type, expires_at) VALUES (?, ?, 'login', ?)",
      [formattedPhone, otpHash, expiresAtFormatted],
    );

    // Kirim OTP via WhatsApp
    const sendResult = await sendWhatsAppOTP(formattedPhone, otp, "login");

    if (sendResult.success) {
      return jsonWithCors(
        { message: "OTP berhasil dikirim ke WhatsApp Anda." },
        { status: 200, request },
      );
    }

    console.error("[whatsapp/login] Gagal mengirim OTP:", sendResult);
    return jsonWithCors(
      { message: "Gagal mengirim OTP. Coba lagi." },
      { status: 500, request },
    );
  } catch (error: any) {
    console.error(
      "Error in whatsapp login send OTP:",
      error?.message || error,
      { stack: error?.stack },
    );
    return jsonWithCors(
      {
        message: "Terjadi kesalahan pada server.",
        detail:
          process.env.NODE_ENV !== "production" ? error?.message : undefined,
      },
      { status: 500, request },
    );
  }
}
