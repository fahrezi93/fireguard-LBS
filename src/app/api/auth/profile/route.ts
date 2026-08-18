import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { pool } from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { randomUUID } from 'crypto';
import { COOKIE_NAME, USER_JWT_EXPIRATION, USER_SESSION_MAX_AGE } from '@/lib/session';
import { getJwtSecretKey } from '@/lib/secrets';
import { getAuthPayloadFromRequest, handleCorsOptions, jsonWithCors, getTokenFromRequest } from '@/lib/cors';
import { getJwtClaimConfig } from '@/lib/api-security';

// OPTIONS: CORS preflight
export async function OPTIONS(request: NextRequest) {
    return handleCorsOptions(request);
}

// GET - Get current user profile from database
export async function GET(request: NextRequest) {
    try {
        const payload = await getAuthPayloadFromRequest(request);

        if (!payload.id) {
            return jsonWithCors({ message: 'User ID tidak ditemukan.' }, { status: 401, request });
        }

        // Get fresh data from database
        const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT id, name, email, phone_number, is_verified, role, is_on_duty, created_at, kelurahan_id FROM users WHERE id = ?',
            [payload.id]
        );

        if (rows.length === 0) {
            return jsonWithCors({ message: 'User tidak ditemukan.' }, { status: 404, request });
        }

        return jsonWithCors(rows[0], { request });
    } catch (error) {
        console.error('Error getting profile:', error);
        return jsonWithCors({ message: 'Token tidak valid atau kedaluwarsa.' }, { status: 401, request });
    }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
    try {
        const payload = await getAuthPayloadFromRequest(request);

        if (!payload.id) {
            return jsonWithCors({ message: 'User ID tidak ditemukan.' }, { status: 401 });
        }

        const body = await request.json();
        const { name, phone_number } = body;

        // Validate input
        if (!name || name.trim().length < 2) {
            return jsonWithCors({ message: 'Nama harus minimal 2 karakter.' }, { status: 400 });
        }

        if (name.trim().length > 100) {
            return jsonWithCors({ message: 'Nama maksimal 100 karakter.' }, { status: 400 });
        }

        // Validate phone number format (optional, but if provided must be valid)
        if (phone_number && phone_number.trim().length > 0) {
            const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/;
            const cleanPhone = phone_number.replace(/[\s-]/g, '');
            if (!phoneRegex.test(cleanPhone)) {
                return jsonWithCors({ message: 'Format nomor telepon tidak valid.' }, { status: 400 });
            }
        }

        // Update database
        await pool.execute(
            'UPDATE users SET name = ?, phone_number = ?, updated_at = NOW() WHERE id = ?',
            [name.trim(), phone_number?.trim() || null, payload.id]
        );

        // Get updated data
        const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT id, name, email, phone_number, is_verified, role, is_on_duty, created_at, kelurahan_id FROM users WHERE id = ?',
            [payload.id]
        );

        if (rows.length === 0) {
            return jsonWithCors({ message: 'User tidak ditemukan.' }, { status: 404, request });
        }

        // Create new JWT token with updated data
        const secret = getJwtSecretKey();
        const newToken = await new jose.SignJWT({
            id: rows[0].id,
            name: rows[0].name,
            email: rows[0].email,
            phone: rows[0].phone_number,
            role: rows[0].role,
            kelurahan_id: rows[0].kelurahan_id,
            isOperator: false,
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setIssuer(getJwtClaimConfig().issuer)
            .setAudience(getJwtClaimConfig().audience)
            .setJti(randomUUID())
            .setExpirationTime(USER_JWT_EXPIRATION)
            .sign(secret);

        // Create response with updated cookie (web) + token in body (Flutter)
        const response = jsonWithCors({
            message: 'Profil berhasil diperbarui.',
            user: rows[0],
            token: newToken,
        }, { request });

        response.cookies.set(COOKIE_NAME, newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: USER_SESSION_MAX_AGE,
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Error updating profile:', error);
        return jsonWithCors({ message: 'Gagal memperbarui profil.' }, { status: 500, request });
    }
}
