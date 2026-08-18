import { NextRequest, NextResponse } from "next/server";
import { pool, queryRows } from "@/lib/db";
import bcrypt from "bcrypt";
import { getAuthPayloadFromRequest, handleCorsOptions, jsonWithCors } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuthPayloadFromRequest(request);
    if (payload.role !== "SUPER_ADMIN") {
      return jsonWithCors({ message: "Akses ditolak." }, { status: 403, request });
    }

    const users = await queryRows(
      "SELECT id, name, email, role, kelurahan_id, phone_number, created_at FROM users ORDER BY created_at DESC"
    );

    return jsonWithCors(users, { request });
  } catch (error) {
    console.error("Admin Users GET Error:", error);
    return jsonWithCors({ message: "Gagal memuat pengguna" }, { status: 500, request });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await getAuthPayloadFromRequest(request);
    if (payload.role !== "SUPER_ADMIN") {
      return jsonWithCors({ message: "Akses ditolak." }, { status: 403, request });
    }

    const { name, email, password, role, kelurahan_id } = await request.json();

    if (!name || !email || !password || !role) {
      return jsonWithCors({ message: "Semua field wajib diisi." }, { status: 400, request });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    await pool.execute(
      "INSERT INTO users (name, email, password_hash, role, kelurahan_id, is_verified) VALUES (?, ?, ?, ?, ?, 1)",
      [name, email, hash, role, kelurahan_id || null]
    );

    return jsonWithCors({ message: "Pengguna berhasil ditambahkan" }, { request, status: 201 });
  } catch (error: any) {
    console.error("Admin Users POST Error:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return jsonWithCors({ message: "Email sudah terdaftar." }, { status: 400, request });
    }
    return jsonWithCors({ message: "Gagal menambahkan pengguna" }, { status: 500, request });
  }
}
