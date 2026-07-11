import { NextRequest, NextResponse } from "next/server";
import { queryRow } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
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

// POST: Login dengan password
export async function POST(request: NextRequest) {
  try {
    const limit = enforceRateLimit(request, "auth-login", 10, 60_000);
    if (!limit.allowed) {
      return jsonWithCors(
        { message: "Terlalu banyak percobaan login. Coba lagi nanti." },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfter) },
          request,
        },
      );
    }

    const { email, password } = await request.json();

    // Validasi input
    if (!email) {
      return jsonWithCors({ message: "Email wajib diisi." }, { status: 400, request });
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return jsonWithCors(
        { message: "Format email tidak valid." },
        { status: 400, request },
      );
    }

    // Cek apakah email sudah terdaftar
    const user = await queryRow<{
      id: number;
      name: string;
      email: string;
      phone_number: string | null;
      password_hash: string | null;
      role: string;
    }>(
      "SELECT id, name, email, phone_number, password_hash, role FROM users WHERE email = ?",
      [email],
    );

    if (!user) {
      return jsonWithCors(
        { message: "Email tidak ditemukan. Belum punya akun? Silakan daftar terlebih dahulu." },
        { status: 404, request },
      );
    }

    // Mode utama: login dengan password
    if (typeof password === "string" && password.length > 0) {
      if (!user.password_hash) {
        return jsonWithCors(
          {
            message:
              "Akun Anda belum memiliki password. Silakan reset password atau hubungi admin.",
          },
          { status: 409, request },
        );
      }

      const isValidPassword = await verifyPassword(
        password,
        user.password_hash,
      );
      if (!isValidPassword) {
        return jsonWithCors(
          { message: "Password salah. Periksa kembali kata sandi Anda." },
          { status: 401, request },
        );
      }

      const secret = getJwtSecretKey();
      const token = await new jose.SignJWT({
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone_number,
        role: user.role,
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

      // Return token in body for Flutter (Bearer) AND set cookie for web browser.
      return new NextResponse(
        JSON.stringify({
          message: "Login berhasil!",
          token,
          user: { id: user.id, name: user.name, email: user.email },
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
    }

    return jsonWithCors(
      { message: "Email dan password wajib diisi." },
      { status: 400, request },
    );
  } catch (error: any) {
    console.error("Error in login:", error?.message || error, { stack: error?.stack });
    return jsonWithCors(
      { message: "Terjadi kesalahan pada server.", detail: process.env.NODE_ENV !== "production" ? error?.message : undefined },
      { status: 500, request },
    );
  }
}
