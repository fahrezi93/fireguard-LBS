import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getAuthPayloadFromRequest, handleCorsOptions, jsonWithCors } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getAuthPayloadFromRequest(request);
    if (payload.role !== "SUPER_ADMIN") {
      return jsonWithCors({ message: "Akses ditolak." }, { status: 403, request });
    }

    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return jsonWithCors({ message: "ID pengguna tidak valid." }, { status: 400, request });
    }

    const { name, email, role, kelurahan_id } = await request.json();

    if (!name || !email || !role) {
      return jsonWithCors({ message: "Nama, email, dan role wajib diisi." }, { status: 400, request });
    }

    await pool.execute(
      "UPDATE users SET name = ?, email = ?, role = ?, kelurahan_id = ? WHERE id = ?",
      [name, email, role, kelurahan_id || null, userId]
    );

    return jsonWithCors({ message: "Pengguna berhasil diperbarui" }, { request, status: 200 });
  } catch (error: any) {
    console.error("Admin Users PUT Error:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return jsonWithCors({ message: "Email sudah terdaftar oleh pengguna lain." }, { status: 400, request });
    }
    return jsonWithCors({ message: "Gagal memperbarui pengguna" }, { status: 500, request });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getAuthPayloadFromRequest(request);
    if (payload.role !== "SUPER_ADMIN") {
      return jsonWithCors({ message: "Akses ditolak." }, { status: 403, request });
    }

    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return jsonWithCors({ message: "ID pengguna tidak valid." }, { status: 400, request });
    }

    await pool.execute("DELETE FROM users WHERE id = ?", [userId]);

    return jsonWithCors({ message: "Pengguna berhasil dihapus" }, { request, status: 200 });
  } catch (error: any) {
    console.error("Admin Users DELETE Error:", error);
    // Handle foreign key constraint error if user has associated reports
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
      return jsonWithCors({ message: "Gagal menghapus! Pengguna ini memiliki riwayat laporan atau tugas yang terkait." }, { status: 400, request });
    }
    return jsonWithCors({ message: "Gagal menghapus pengguna" }, { status: 500, request });
  }
}
