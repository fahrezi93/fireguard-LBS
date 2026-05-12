import { NextRequest, NextResponse } from "next/server";
import { queryRow, execute, executeAndGetLastInsertId } from "@/lib/db";
import { verifyOtp, hashPassword } from "@/lib/auth";
import * as jose from "jose";
import { serialize } from "cookie";
import { randomUUID } from "crypto";
import { COOKIE_NAME, USER_JWT_EXPIRATION, USER_SESSION_MAX_AGE } from "@/lib/session";
import { getJwtSecretKey } from "@/lib/secrets";
import { handleCorsOptions, jsonWithCors, corsHeaders } from "@/lib/cors";
import { getJwtClaimConfig } from "@/lib/api-security";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function OPTIONS() {
    return handleCorsOptions();
}

// POST: Verifikasi OTP registrasi dan buat user baru
export async function POST(request: NextRequest) {
    try {
        const limit = enforceRateLimit(request, "auth-register-verify", 10, 60_000);
        if (!limit.allowed) {
            return jsonWithCors(
                { message: "Terlalu banyak percobaan verifikasi. Coba lagi nanti." },
                { status: 429, headers: { "Retry-After": String(limit.retryAfter) }, request }
            );
        }

        const { email, otp, name, phoneNumber, password } = await request.json();

        if (!email || !otp || !phoneNumber) {
            return jsonWithCors({ message: "Email, OTP, dan nomor WhatsApp diperlukan." }, { status: 400 });
        }

        if (password && password.length < 6) {
            return jsonWithCors({ message: "Password minimal 6 karakter." }, { status: 400 });
        }

        // Cek OTP
        const attempt = await queryRow<{ otp_hash: string; expires_at: Date }>(
            "SELECT otp_hash, expires_at FROM otp_attempts WHERE email = ? AND type = 'register' ORDER BY id DESC LIMIT 1",
            [email]
        );

        if (!attempt) {
            return jsonWithCors(
                { message: "OTP tidak ditemukan. Silakan request OTP baru." },
                { status: 400 }
            );
        }

        // Cek expired — mysql2 dengan timezone '+00:00' mengembalikan Date UTC yang benar
        const expiresAt = new Date(attempt.expires_at);
        const now = new Date();
        console.log(`[OTP Register] expires: ${expiresAt.toISOString()}, now: ${now.toISOString()}, expired: ${expiresAt < now}`);

        if (expiresAt < now) {
            return jsonWithCors(
                { message: "OTP sudah kedaluwarsa. Silakan request OTP baru." },
                { status: 400 }
            );
        }

        // Verifikasi OTP
        if (!verifyOtp(otp, attempt.otp_hash)) {
            return jsonWithCors({ message: "Kode OTP salah." }, { status: 400 });
        }

        // Hapus OTP yang sudah digunakan
        await execute("DELETE FROM otp_attempts WHERE email = ?", [email]);

        // Cek apakah email sudah terdaftar (double check)
        const existingUser = await queryRow<{ id: number }>(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existingUser) {
            return jsonWithCors({ message: "Email ini sudah terdaftar. Silakan masuk menggunakan akun Anda." }, { status: 400 });
        }

        // Hash password
        const passwordToHash = password || "changeme123";
        const passwordHash = await hashPassword(passwordToHash);

        // Buat user baru
        const userId = await executeAndGetLastInsertId(
            "INSERT INTO users (name, email, phone_number, password_hash, is_verified) VALUES (?, ?, ?, ?, 1)",
            [name || email.split("@")[0], email, phoneNumber, passwordHash]
        );

        // Generate JWT token
        const secret = getJwtSecretKey();
        const token = await new jose.SignJWT({
            id: userId,
            email,
            name: name || email.split("@")[0],
            phone: phoneNumber,
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

        return new NextResponse(
            JSON.stringify({
                message: "Registrasi berhasil!",
                token,
                user: { id: userId, name: name || email.split("@")[0], email },
            }),
            {
                status: 201,
                headers: {
                    "Set-Cookie": serializedCookie,
                    "Content-Type": "application/json",
                    ...corsHeaders(request),
                },
            }
        );
    } catch (error: any) {
        console.error("Error verifying register OTP:", error);
        return jsonWithCors({ message: "Terjadi kesalahan pada server." }, { status: 500 });
    }
}
