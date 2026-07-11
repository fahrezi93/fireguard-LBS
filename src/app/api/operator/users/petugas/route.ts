import { NextRequest, NextResponse } from "next/server";
import { executeAndGetLastInsertId, queryRows } from "@/lib/db";
import { requireOperator } from "@/lib/api-security";
import { hashPassword } from "@/lib/auth";

export async function GET(request: NextRequest) {
    try {
        const auth = await requireOperator(request);
        if ("response" in auth) return auth.response;

        const petugas = await queryRows(
            "SELECT id, name, email, phone_number, is_verified, created_at FROM users WHERE role = 'petugas' ORDER BY created_at DESC"
        );
        return NextResponse.json({ success: true, data: petugas });
    } catch (error) {
        console.error("Error fetching petugas:", error);
        return NextResponse.json({ success: false, message: "Gagal mengambil data petugas" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await requireOperator(request);
        if ("response" in auth) return auth.response;

        const body = await request.json();
        const { name, email, phone_number, password } = body;

        if (!name || !email || !password) {
            return NextResponse.json({ success: false, message: "Nama, email, dan password wajib diisi" }, { status: 400 });
        }

        const hashedPassword = await hashPassword(password);
        
        const insertId = await executeAndGetLastInsertId(
            "INSERT INTO users (name, email, phone_number, password_hash, role, is_verified) VALUES (?, ?, ?, ?, 'petugas', 1)",
            [name, email, phone_number || null, hashedPassword]
        );

        return NextResponse.json({ success: true, message: "Akun petugas berhasil dibuat", id: insertId });
    } catch (error: any) {
        console.error("Error creating petugas:", error);
        if (error.code === 'ER_DUP_ENTRY') {
             return NextResponse.json({ success: false, message: "Email sudah terdaftar!" }, { status: 400 });
        }
        return NextResponse.json({ success: false, message: "Gagal membuat akun petugas" }, { status: 500 });
    }
}
