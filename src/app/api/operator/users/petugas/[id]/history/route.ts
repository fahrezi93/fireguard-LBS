import { NextRequest } from "next/server";
import { queryRow, queryRows } from "@/lib/db";
import { requireOperator } from "@/lib/api-security";
import { jsonWithCors } from "@/lib/cors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireOperator(request);
    if ("response" in auth) return auth.response;

    const { id } = await params;
    const petugasId = parseInt(id);

    if (isNaN(petugasId)) {
      return jsonWithCors({ message: "ID petugas tidak valid." }, { status: 400, request });
    }

    // Ambil data petugas
    const petugas = await queryRow<{ id: number, name: string, email: string, phone_number: string }>(
      "SELECT id, name, email, phone_number FROM users WHERE id = ? AND role = 'petugas'",
      [petugasId]
    );

    if (!petugas) {
      return jsonWithCors({ message: "Data petugas tidak ditemukan." }, { status: 404, request });
    }

    // Ambil riwayat laporan
    const history = await queryRows(
      `SELECT r.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
       k.name as kelurahan_name, k.kecamatan, k.kota,
       u.name as registered_name,
       u.phone_number as registered_phone
       FROM reports r
       LEFT JOIN disaster_categories c ON r.category_id = c.id
       LEFT JOIN kelurahan k ON r.kelurahan_id = k.id
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.assigned_petugas_id = ? 
       AND r.status_petugas IN ('completed', 'false_report', 'dibatalkan')
       ORDER BY COALESCE(r.completed_at, r.created_at) DESC`,
      [petugasId]
    );

    // Hitung metrik
    const totalHandled = history.length;
    const totalCompleted = history.filter((h: any) => h.status_petugas === 'completed').length;
    const avgResponseTime = history.filter((h: any) => h.response_time_seconds != null).reduce((acc: number, curr: any) => acc + curr.response_time_seconds, 0) / (totalCompleted || 1);

    return jsonWithCors({
      success: true,
      petugas: {
        ...petugas,
        total_handled: totalHandled,
        total_completed: totalCompleted,
        avg_response_time: isNaN(avgResponseTime) ? 0 : Math.round(avgResponseTime)
      },
      history
    }, { status: 200, request });

  } catch (error: any) {
    console.error("Petugas History Error:", error);
    return jsonWithCors({
      success: false,
      message: "Terjadi kesalahan internal.",
    }, { status: 500, request });
  }
}
