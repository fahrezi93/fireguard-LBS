import { NextRequest } from "next/server";
import { queryRow, execute, pool } from "@/lib/db";
import { getAuthPayloadFromRequest, handleCorsOptions, jsonWithCors } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthPayloadFromRequest(request);

    // Pastikan ini adalah petugas
    if (user.role?.toUpperCase() !== 'PETUGAS') {
      return jsonWithCors({ message: "Hanya petugas yang bisa menerima tugas ini." }, { status: 403, request });
    }

    const { reportId } = await request.json();

    if (!reportId) {
      return jsonWithCors({ message: "ID Laporan (reportId) wajib diisi." }, { status: 400, request });
    }

    // Gunakan koneksi dari pool secara langsung agar bisa menggunakan transaksi
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Lock baris laporan spesifik dengan FOR UPDATE untuk mencegah Race Condition (Rebutan)
      const [rows]: any = await connection.execute(
        "SELECT id, assigned_petugas_id, status_petugas FROM reports WHERE id = ? FOR UPDATE",
        [reportId]
      );

      if (rows.length === 0) {
        await connection.rollback();
        return jsonWithCors({ message: "Laporan tidak ditemukan." }, { status: 404, request });
      }

      const report = rows[0];

      // Cek jika sudah diambil orang lain
      if (report.assigned_petugas_id !== null) {
        await connection.rollback();
        return jsonWithCors({ message: "Maaf, tugas ini sudah diambil oleh petugas lain." }, { status: 400, request });
      }

      // Tandai diambil dan ubah status utama ke in_progress agar operator tahu
      await connection.execute(
        "UPDATE reports SET assigned_petugas_id = ?, status = 'in_progress', status_petugas = 'accepted', accepted_at = NOW() WHERE id = ?",
        [user.id, reportId]
      );

      await connection.commit();

      // Broadcast WebSocket
      const wss = (global as any).wss;
      if (wss) {
        wss.broadcast(
          JSON.stringify({
            type: "STATUS_UPDATE",
            payload: { reportId: Number(reportId), newStatus: 'in_progress' },
          })
        );
      }

      return jsonWithCors({
        success: true,
        message: "Berhasil mengambil tugas! Segera menuju lokasi."
      }, { status: 200, request });

    } catch (transactionError) {
      await connection.rollback();
      throw transactionError;
    } finally {
      connection.release();
    }

  } catch (error: any) {
    if (error.message?.includes("autentikasi") || error.message?.includes("Token")) {
      return jsonWithCors({ message: "Akses ditolak." }, { status: 401, request });
    }
    console.error("Accept Error:", error);
    return jsonWithCors({
      success: false,
      message: "Terjadi kesalahan internal.",
    }, { status: 500, request });
  }
}
