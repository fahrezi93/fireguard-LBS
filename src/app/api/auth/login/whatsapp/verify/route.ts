import { NextRequest, NextResponse } from "next/server";
import { queryRow, execute } from "@/lib/db";
import { verifyOtp } from "@/lib/auth";
import * as jose from "jose";
import { serialize } from "cookie";
import { randomUUID } from "crypto";
import {
  COOKIE_NAME,
  USER_JWT_EXPIRATION,
  USER_SESSION_MAX_AGE,
} from "@/lib/session";
import { getJwtSecretKey } from "@/lib/secrets";
import { corsHeaders, handleCorsOptions, jsonWithCors } from "@/lib/cors";
import { getJwtClaimConfig } from "@/lib/api-security";
import { enforceRateLimit } from "@/lib/rate-limit";

// OPTIONS: CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

// POST: Verifikasi OTP WhatsApp dan login
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 10 percobaan per 60 detik per IP
    const limit = enforceRateLimit(
      request,
      "whatsapp-login-verify",
      10,
      60_000,
    );
    if (!limit.allowed) {
      return jsonWithCors(
        { message: "Terlalu banyak percobaan verifikasi. Coba lagi nanti." },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfter) },
          request,
        },
      );
    }

    const body = await request.json();
    const { phone_number, otp } = body;

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

    if (!otp || typeof otp !== "string" || otp.trim() === "") {
      return jsonWithCors(
        { message: "Kode OTP wajib diisi." },
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

    // Ambil OTP terbaru dari database untuk nomor ini (coba kedua format jika perlu)
    const row = await queryRow<{
      id: number;
      otp_hash: string;
      expires_at: Date;
    }>(
      "SELECT id, otp_hash, expires_at FROM otp_attempts WHERE (email = ? OR email = ?) AND type = 'login' ORDER BY created_at DESC LIMIT 1",
      [formattedPhone, altPhone],
    );

    if (!row) {
      return jsonWithCors(
        { message: "Tidak ada OTP aktif. Silakan minta OTP baru." },
        { status: 400, request },
      );
    }

    // Cek apakah OTP sudah kadaluwarsa
    if (new Date(row.expires_at) < new Date()) {
      await execute("DELETE FROM otp_attempts WHERE id = ?", [row.id]);
      return jsonWithCors(
        { message: "OTP sudah kedaluwarsa. Silakan minta OTP baru." },
        { status: 400, request },
      );
    }

    // Verifikasi kode OTP
    const isValid = verifyOtp(otp.trim(), row.otp_hash);
    if (!isValid) {
      return jsonWithCors(
        { message: "OTP salah. Periksa kembali kode yang diterima." },
        { status: 401, request },
      );
    }

    // Hapus OTP yang sudah berhasil digunakan
    await execute("DELETE FROM otp_attempts WHERE id = ?", [row.id]);

    // Cari data user berdasarkan nomor telepon (coba kedua format)
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
        { message: "User tidak ditemukan." },
        { status: 404, request },
      );
    }

    // Buat JWT token (pola identik dengan email login)
    const secret = getJwtSecretKey();
    const token = await new jose.SignJWT({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone_number,
      isOperator: false,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setIssuer(getJwtClaimConfig().issuer)
      .setAudience(getJwtClaimConfig().audience)
      .setJti(randomUUID())
      .setExpirationTime(USER_JWT_EXPIRATION)
      .sign(secret);

    const serializedCookie = serialize(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: USER_SESSION_MAX_AGE,
    });

    // Return token dalam body untuk Flutter (Bearer) DAN set cookie untuk web browser
    return new NextResponse(
      JSON.stringify({
        message: "Login berhasil!",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone_number,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": serializedCookie,
          ...corsHeaders(request),
        },
      },
    );
  } catch (error: any) {
    console.error(
      "Error in whatsapp login verify OTP:",
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
