import { NextRequest } from "next/server";
import { queryRow, execute, queryRows } from "@/lib/db";
import { getAuthPayloadFromRequest, handleCorsOptions, jsonWithCors } from "@/lib/cors";
import { getMessaging } from "@/lib/firebase-admin";

export async function OPTIONS() {
  return handleCorsOptions();
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthPayloadFromRequest(request);

    // Pastikan user adalah operator
    if (!user.isOperator && user.role !== 'operator') {
      return jsonWithCors({ message: "Akses ditolak. Anda bukan operator." }, { status: 403, request });
    }

    const { reportId } = await request.json();

    if (!reportId) {
      return jsonWithCors({ message: "ID Laporan (reportId) wajib diisi." }, { status: 400, request });
    }

    // Ambil detail laporan dan pastikan kelurahan_id ada
    const report = await queryRow<{ id: number, kelurahan_id: number, status: string, assigned_petugas_id: number, category_name: string }>(
      "SELECT r.id, r.kelurahan_id, r.status, r.assigned_petugas_id, c.name as category_name FROM reports r LEFT JOIN disaster_categories c ON r.category_id = c.id WHERE r.id = ?",
      [reportId]
    );

    if (!report) {
      return jsonWithCors({ message: "Laporan tidak ditemukan." }, { status: 404, request });
    }

    if (report.status === 'completed' || report.status === 'false_report') {
      return jsonWithCors({ message: "Laporan sudah selesai, tidak perlu di-dispatch." }, { status: 400, request });
    }

    if (report.status === 'dispatched' || report.status === 'dikirim' || report.status === 'ditangani' || report.status === 'in_progress') {
      return jsonWithCors({ message: "Laporan ini sudah di-dispatch atau sedang ditangani." }, { status: 400, request });
    }

    if (report.assigned_petugas_id) {
      return jsonWithCors({ message: "Laporan sudah diambil oleh petugas." }, { status: 400, request });
    }

    if (!report.kelurahan_id) {
      return jsonWithCors({ message: "Laporan belum memiliki wilayah kelurahan (kelurahan_id kosong)." }, { status: 400, request });
    }

    // Cari semua petugas yang sedang piket tanpa mempedulikan kelurahannya
    const petugasList = await queryRows<{ id: number, name: string }>(
      "SELECT id, name FROM users WHERE role = 'petugas' AND is_on_duty = 1"
    );

    if (petugasList.length === 0) {
      return jsonWithCors({ 
        message: "Tidak ada petugas yang sedang piket (On Duty) saat ini.", 
        petugas_count: 0 
      }, { status: 404, request });
    }

    const petugasIds = petugasList.map(p => p.id);

    // Update laporan menjadi 'dispatched' dan catat waktunya
    await execute(
      "UPDATE reports SET dispatched_at = NOW(), status_petugas = 'pending' WHERE id = ?",
      [reportId]
    );

    // Ambil token FCM petugas
    const tokens = await queryRows<{ device_token: string }>(
      `SELECT device_token FROM device_tokens WHERE user_id IN (${petugasIds.map(() => '?').join(',')}) AND is_active = TRUE`,
      petugasIds
    );

    const messaging = getMessaging();
    let sentCount = 0;

    if (messaging && tokens.length > 0) {
      // Kirim Broadcast FCM ke semua petugas
      const tokenStrings = tokens.map(t => t.device_token);
      
      const payload = {
        notification: {
          title: `🚨 DARURAT: ${report.category_name || 'Bencana'} Baru!`,
          body: "Buka aplikasi sekarang untuk mengambil tugas ini!",
        },
        data: {
          type: "dispatch",
          target: "mobile",
          reportId: String(reportId),
        },
        android: {
          priority: "high" as const,
          notification: {
            sound: "emergency_siren",
            channelId: "siagabencana_emergency",
          },
        },
      };

      try {
        const response = await messaging.sendEachForMulticast({
          tokens: tokenStrings,
          ...payload
        });
        sentCount = response.successCount;
      } catch (fcmErr) {
        console.error("Gagal mengirim FCM dispatch:", fcmErr);
      }
    }

    return jsonWithCors({
      success: true,
      message: `Tugas berhasil di-broadcast ke ${petugasList.length} petugas.`,
      dispatched_to: petugasList.length,
      fcm_sent: sentCount
    }, { status: 200, request });

  } catch (error: any) {
    if (error.message?.includes("autentikasi") || error.message?.includes("Token")) {
      return jsonWithCors({ message: "Akses ditolak." }, { status: 401, request });
    }
    console.error("Dispatch Error:", error);
    return jsonWithCors({
      success: false,
      message: "Terjadi kesalahan internal.",
    }, { status: 500, request });
  }
}
