import { NextRequest } from "next/server";
import { queryRow, execute } from "@/lib/db";
import { getAuthPayloadFromRequest, handleCorsOptions, jsonWithCors } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthPayloadFromRequest(request);

    if (user.role !== 'PETUGAS') {
      return jsonWithCors({ message: "Hanya petugas yang bisa meminta bantuan armada." }, { status: 403, request });
    }

    const { reportId } = await request.json();

    if (!reportId) {
      return jsonWithCors({ message: "ID laporan tidak valid." }, { status: 400, request });
    }

    // Check if report exists and is assigned to this petugas
    const report: any = await queryRow(`SELECT id, status FROM reports WHERE id = ? AND assigned_petugas_id = ?`, [reportId, user.id]);

    if (!report) {
      return jsonWithCors({ message: "Laporan tidak ditemukan atau Anda tidak ditugaskan ke laporan ini." }, { status: 404, request });
    }

    if (['completed', 'false_report', 'selesai', 'dibatalkan'].includes(report.status)) {
      return jsonWithCors({ message: "Tidak dapat meminta bantuan untuk tugas yang sudah selesai." }, { status: 400, request });
    }

    const adminNoteAppend = "\n[URGENT] Petugas meminta bantuan armada tambahan (SOS)!";

    await execute(
      `UPDATE reports SET needs_backup = 1, admin_notes = CONCAT(IFNULL(admin_notes, ''), ?) WHERE id = ?`,
      [adminNoteAppend, reportId]
    );

    const wss = (global as any).wss;
    if (wss) {
      wss.broadcast(
        JSON.stringify({
          type: "BACKUP_REQUEST",
          payload: { reportId, petugasName: user.name }
        })
      );
    }

    return jsonWithCors({ success: true, message: "Permintaan bantuan berhasil dikirim ke markas." }, { status: 200, request });
  } catch (error: any) {
    console.error('Request backup error:', error);
    return jsonWithCors({ message: "Terjadi kesalahan internal server.", error: error.message }, { status: 500, request });
  }
}
