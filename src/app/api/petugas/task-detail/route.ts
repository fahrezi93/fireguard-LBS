import { NextRequest } from "next/server";
import { queryRow } from "@/lib/db";
import { getAuthPayloadFromRequest, handleCorsOptions, jsonWithCors } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayloadFromRequest(request);

    if (user.role !== 'petugas') {
      return jsonWithCors({ message: "Akses ditolak. Anda bukan petugas." }, { status: 403, request });
    }

    const searchParams = request.nextUrl.searchParams;
    const reportId = searchParams.get('id');

    if (!reportId) {
      return jsonWithCors({ message: "ID Laporan diperlukan." }, { status: 400, request });
    }

    const task = await queryRow(
      `SELECT r.*, c.name as category_name, c.icon as category_icon, 
       k.name as kelurahan_name
       FROM reports r
       LEFT JOIN disaster_categories c ON r.category_id = c.id
       LEFT JOIN kelurahan k ON r.kelurahan_id = k.id
       WHERE r.id = ?`,
      [reportId]
    );

    if (!task) {
      return jsonWithCors({ message: "Tugas tidak ditemukan." }, { status: 404, request });
    }

    return jsonWithCors({
      success: true,
      task: task
    }, { status: 200, request });

  } catch (error: any) {
    console.error("GET /api/petugas/task-detail ERROR:", error);
    return jsonWithCors({ message: "Terjadi kesalahan server", error: error.message }, { status: 500, request });
  }
}
