import { createNotification } from "@/lib/notification-helpers";
import { queryRow, execute, formatDateForMySQL } from "@/lib/db";
import { getAuthPayloadFromRequest, handleCorsOptions, jsonWithCors } from "@/lib/cors";
import { sendReportStatusNotification } from "@/services/notification-service";
import { NextRequest } from "next/server";
import { sendWhatsAppReportUpdate } from "@/lib/whatsapp";
import { getAddressFromCoordinates } from "@/lib/geo";

export const dynamic = 'force-dynamic';

// OPTIONS: CORS preflight
export async function OPTIONS() {
  return handleCorsOptions();
}

interface Report {
  id: number;
  user_id: number;
  status: string;
  fire_latitude: number;
  fire_longitude: number;
  description: string | null;
  category_name: string | null;
  admin_notes: string | null;
}

/**
 * GET /api/reports/[id]
 * Ambil detail laporan berdasarkan ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reportId = parseInt(id);

    if (isNaN(reportId)) {
      return jsonWithCors({ message: "ID laporan tidak valid." }, { status: 400, request });
    }

    const user = await getAuthPayloadFromRequest(request);

    const report = await queryRow<Report>(
      `SELECT r.*, 
              dc.name as category_name, dc.icon as category_icon,
              k.name as kelurahan_name, k.kecamatan,
              u.last_latitude as petugas_lat, u.last_longitude as petugas_lng
       FROM reports r
       LEFT JOIN disaster_categories dc ON r.category_id = dc.id
       LEFT JOIN kelurahan k ON r.kelurahan_id = k.id
       LEFT JOIN users u ON r.assigned_petugas_id = u.id
       WHERE r.id = ? AND r.user_id = ?`,
      [reportId, user.id]
    );

    if (!report) {
      return jsonWithCors({ message: "Laporan tidak ditemukan." }, { status: 404, request });
    }

    return jsonWithCors({ success: true, data: report }, { status: 200, request });
  } catch (error: any) {
    console.error("Error fetching report detail:", error);
    if (error.message?.includes("autentikasi")) {
      return jsonWithCors({ message: "Akses ditolak." }, { status: 401, request });
    }
    return jsonWithCors({ message: "Terjadi kesalahan pada server." }, { status: 500, request });
  }
}

/**
 * PATCH /api/reports/[id]
 * Update status laporan (operator only)
 * Secara otomatis mengirim notifikasi push ke pemilik laporan
 *
 * Request Body:
 * {
 *   status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'verified' | 'false_report';
 *   admin_notes?: string;
 * }
 *
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reportId = parseInt(id);

    if (isNaN(reportId)) {
      return jsonWithCors({ message: "ID laporan tidak valid." }, { status: 400, request });
    }

    const user = await getAuthPayloadFromRequest(request);

    // Hanya operator dan admin yang boleh update status laporan
    if (!user.isOperator && user.role !== 'SUPER_ADMIN') {
      return jsonWithCors(
        { message: "Akses ditolak. Hanya operator dan admin yang dapat memperbarui status laporan." },
        { status: 403, request }
      );
    }

    const body = await request.json();
    const { status: newStatus, admin_notes } = body;

    // Validasi status
    const validStatuses = ["pending", "approved", "in_progress", "completed", "verified", "false_report"];
    if (!newStatus || !validStatuses.includes(newStatus)) {
      return jsonWithCors(
        { message: `Status tidak valid. Pilih dari: ${validStatuses.join(", ")}` },
        { status: 400, request }
      );
    }

    // Ambil data laporan beserta user_id pemilik
    const report = await queryRow<Report>(
      `SELECT r.*, 
              dc.name as category_name
       FROM reports r
       LEFT JOIN disaster_categories dc ON r.category_id = dc.id
       WHERE r.id = ?`,
      [reportId]
    );

    if (!report) {
      return jsonWithCors({ message: "Laporan tidak ditemukan." }, { status: 404, request });
    }

    const currentTimestamp = formatDateForMySQL(new Date());

    // Update status laporan di database
    if (admin_notes !== undefined) {
      await execute(
        "UPDATE reports SET status = ?, admin_notes = ?, updated_at = ? WHERE id = ?",
        [newStatus, admin_notes || null, currentTimestamp, reportId]
      );
    } else {
      await execute(
        "UPDATE reports SET status = ?, updated_at = ? WHERE id = ?",
        [newStatus, currentTimestamp, reportId]
      );
    }

    // Simpan dulu ke tabel notifications (in-app notification history),
    // dapatkan ID-nya, lalu kirim FCM dengan ID yang sama agar mobile bisa
    // melakukan dedup, mark-read, dan delete sync ke backend.
    const dbNotifId = await createNotification(
      report.user_id,
      _getNotificationTitle(newStatus),
      _getNotificationBody(newStatus, reportId),
      "status_update",
      reportId
    ).catch((error) => {
      console.error(`[Notification] Failed to create in-app notification for report ${reportId}:`, error);
      return null;
    });

    // Trigger FCM push notification secara asinkron (Requirement 9.1–9.5)
    // Tidak memblokir response walau notifikasi gagal.
    sendReportStatusNotification(
      reportId,
      report.user_id,
      newStatus,
      dbNotifId ?? undefined,
    ).catch((error) => {
      console.error(`[Notification] Failed to send notification for report ${reportId}:`, error);
    });

    // Broadcast ke WebSocket jika ada (dashboard real-time)
    const wss = global.wss;
    if (wss) {
      wss.broadcast(
        JSON.stringify({
          type: "REPORT_STATUS_UPDATED",
          payload: { reportId, status: newStatus, updatedAt: currentTimestamp },
        })
      );
    }

    // KIRIM NOTIFIKASI WHATSAPP
    try {
      const userFull = await queryRow<{ name: string; phone_number: string }>(
        "SELECT name, phone_number FROM users WHERE id = ?",
        [report.user_id]
      );
      
      if (userFull && userFull.phone_number) {
        const address = await getAddressFromCoordinates(report.fire_latitude, report.fire_longitude);
        const statusLabel = _getNotificationTitle(newStatus); // Gunakan helper title sebagai label

        sendWhatsAppReportUpdate(
          userFull.phone_number,
          userFull.name,
          reportId,
          statusLabel,
          address,
          admin_notes
        );
      }
    } catch (waError) {
      console.error("[WhatsApp] Failed to send status update:", waError);
    }

    return jsonWithCors(
      {
        success: true,
        message: "Status laporan berhasil diperbarui.",
        data: { id: reportId, status: newStatus, updated_at: currentTimestamp },
      },
      { status: 200, request }
    );
  } catch (error: any) {
    console.error("Error updating report status:", error);
    if (error.message?.includes("autentikasi")) {
      return jsonWithCors({ message: "Akses ditolak." }, { status: 401, request });
    }
    return jsonWithCors({ message: "Terjadi kesalahan pada server." }, { status: 500, request });
  }
}

// Helper: ambil judul notifikasi berdasarkan status (sama dengan notification-service.ts)
function _getNotificationTitle(status: string): string {
  const titles: Record<string, string> = {
    approved: "Laporan Disetujui",
    in_progress: "Laporan Sedang Ditangani",
    completed: "Laporan Selesai",
    verified: "Laporan Terverifikasi",
    false_report: "Laporan Ditolak",
  };
  return titles[status] ?? "Pembaruan Laporan";
}

// Helper: ambil isi notifikasi berdasarkan status
function _getNotificationBody(status: string, _reportId: number): string {
  const bodies: Record<string, string> = {
    approved: "Laporan Anda telah disetujui dan sedang diproses",
    in_progress: "Petugas sedang menangani laporan Anda",
    completed: "Laporan Anda telah diselesaikan",
    verified: "Laporan Anda telah diverifikasi oleh petugas",
    false_report: "Laporan Anda ditandai sebagai laporan palsu",
  };
  return bodies[status] ?? "Status laporan Anda telah diperbarui";
}
