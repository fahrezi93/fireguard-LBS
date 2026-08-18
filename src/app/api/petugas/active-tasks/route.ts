import { NextRequest } from "next/server";
import { queryRow, queryRows } from "@/lib/db";
import { getAuthPayloadFromRequest, handleCorsOptions, jsonWithCors } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayloadFromRequest(request);

    if (user.role?.toUpperCase() !== 'PETUGAS') {
      return jsonWithCors({ message: "Akses ditolak. Anda bukan petugas." }, { status: 403, request });
    }

    // Ambil data user lengkap untuk tahu kelurahan_id dan is_on_duty
    const petugasInfo = await queryRow<{ kelurahan_id: number, is_on_duty: number }>(
      "SELECT kelurahan_id, is_on_duty FROM users WHERE id = ?",
      [user.id]
    );

    if (!petugasInfo) {
      return jsonWithCors({ message: "Data petugas tidak ditemukan." }, { status: 404, request });
    }

    // 1. Cek laporan yang sedang dikerjakan (assigned ke petugas ini dan belum selesai)
    // Asumsi status_petugas: 'accepted' atau 'arrived' 
    // atau assigned_petugas_id = user.id dan status belum 'resolved' atau 'false_report'
    const activeTasks = await queryRows(
      `SELECT r.*, c.name as category_name, c.icon as category_icon, 
       k.name as kelurahan_name,
       u.name as registered_name,
       u.phone_number as registered_phone
       FROM reports r
       LEFT JOIN disaster_categories c ON r.category_id = c.id
       LEFT JOIN kelurahan k ON r.kelurahan_id = k.id
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.assigned_petugas_id = ? 
       AND r.status_petugas IN ('accepted', 'arrived')`,
      [user.id]
    );

    // 2. Jika tidak ada tugas aktif, dan petugas sedang piket, cek tugas baru (pending/dispatched)
    let pendingTasks: any[] = [];
    if (activeTasks.length === 0 && petugasInfo.is_on_duty === 1) {
      pendingTasks = await queryRows(
        `SELECT r.*, c.name as category_name, c.icon as category_icon, 
         k.name as kelurahan_name,
         u.name as registered_name,
         u.phone_number as registered_phone
         FROM reports r
         LEFT JOIN disaster_categories c ON r.category_id = c.id
         LEFT JOIN kelurahan k ON r.kelurahan_id = k.id
         LEFT JOIN users u ON r.user_id = u.id
         WHERE r.dispatched_at IS NOT NULL 
         AND r.assigned_petugas_id IS NULL
         AND r.status NOT IN ('completed', 'false_report')`
      );
    }

    return jsonWithCors({
      success: true,
      active_task: activeTasks.length > 0 ? activeTasks[0] : null,
      pending_tasks: pendingTasks
    }, { status: 200, request });

  } catch (error: any) {
    if (error.message?.includes("autentikasi") || error.message?.includes("Token")) {
      return jsonWithCors({ message: "Akses ditolak." }, { status: 401, request });
    }
    console.error("Active Tasks Error:", error);
    return jsonWithCors({
      success: false,
      message: "Terjadi kesalahan internal.",
    }, { status: 500, request });
  }
}
