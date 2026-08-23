import { NextRequest, NextResponse } from "next/server";
import { queryRow, execute } from "@/lib/db";
import { getAddressFromCoordinates } from "@/lib/geo";
import { sendStatusUpdateEmail } from "@/lib/email";
import { requireOperator } from "@/lib/api-security";
import { sendWhatsAppReportUpdate } from "@/lib/whatsapp";

// Helper: title notifikasi per status (konsisten dengan notification-service.ts & reports/[id]/route.ts)
function _getNotifTitle(status: string): string {
  const titles: Record<string, string> = {
    approved: 'Laporan Disetujui',
    in_progress: 'Laporan Sedang Ditangani',
    completed: 'Laporan Selesai',
    verified: 'Laporan Terverifikasi',
    false_report: 'Laporan Ditolak',
  };
  return titles[status] ?? 'Pembaruan Laporan';
}

// Helper: body notifikasi per status (konsisten dengan notification-service.ts & reports/[id]/route.ts)
function _getNotifBody(status: string): string {
  const bodies: Record<string, string> = {
    approved: 'Laporan Anda telah disetujui dan sedang diproses',
    in_progress: 'Petugas sedang menangani laporan Anda',
    completed: 'Laporan Anda telah diselesaikan',
    verified: 'Laporan Anda telah diverifikasi oleh petugas',
    false_report: 'Laporan Anda ditandai sebagai laporan palsu',
  };
  return bodies[status] ?? 'Status laporan Anda telah diperbarui';
}

// --- Konfigurasi Fonnte (Opsional) ---
const ENABLE_WHATSAPP = process.env.ENABLE_WHATSAPP === "true";
const ALLOWED_REPORT_STATUS = new Set([
  "pending",
  "submitted",
  "approved",
  "verified",
  "in_progress",
  "diproses",
  "dispatched",
  "dikirim",
  "arrived",
  "ditangani",
  "completed",
  "selesai",
  "false_report",
  "dibatalkan",
  "false",
  "escalated_to_damkar",
]);

const NOTIFICATION_STATUS_MAP: Record<string, string> = {
  approved: 'approved',
  in_progress: 'in_progress',
  completed: 'completed',
  verified: 'verified',
  false_report: 'false_report',
  diproses: 'in_progress',
  ditangani: 'in_progress',
  dispatched: 'in_progress',
  dikirim: 'in_progress',
  arrived: 'in_progress',
  selesai: 'completed',
  false: 'false_report',
};

function normalizeNotificationStatus(status: string): string {
  const normalized = status.trim().toLowerCase();
  return NOTIFICATION_STATUS_MAP[normalized] || normalized;
}


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const auth = await requireOperator(request);
    if ("response" in auth) return auth.response;

    const { reportId } = await params;
    const parsedReportId = Number(reportId);
    if (!Number.isInteger(parsedReportId) || parsedReportId <= 0) {
      return NextResponse.json({ message: "ID laporan tidak valid." }, { status: 400 });
    }
    const report = await queryRow(
      `SELECT 
              r.id, r.user_id, r.fire_latitude, r.fire_longitude, r.reporter_latitude, r.reporter_longitude,
              r.status, r.created_at, r.media_url, r.notes, r.contact, r.description, r.address,
              r.guest_name, r.admin_notes,
              r.assigned_petugas_id, r.dispatched_at, r.accepted_at, r.arrived_at, r.completed_at, 
              r.status_petugas, r.completion_photo_url, r.response_time_seconds, r.needs_backup, r.petugas_notes,
              p.name as assigned_petugas_name,
              u.name as user_name, u.email as user_email, u.phone_number,
              c.id as category_id, c.name as category_name, c.icon as category_icon, c.color as category_color,
              k.id as kelurahan_id, k.name as kelurahan_name, k.kecamatan, k.kota
       FROM reports r 
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN users p ON r.assigned_petugas_id = p.id
       LEFT JOIN disaster_categories c ON r.category_id = c.id
       LEFT JOIN kelurahan k ON r.kelurahan_id = k.id
       WHERE r.id = ?`,
      [parsedReportId]
    );
    if (!report) {
      return NextResponse.json(
        { message: "Laporan tidak ditemukan." },
        { status: 404 }
      );
    }

    // Bentuk ulang response agar konsisten dengan format list (nested category & kelurahan)
    const r = report as any;
    const formatted = {
      ...r,
      category: r.category_id ? {
        id: r.category_id,
        name: r.category_name,
        icon: r.category_icon,
        color: r.category_color,
      } : null,
      kelurahan: r.kelurahan_id ? {
        id: r.kelurahan_id,
        name: r.kelurahan_name,
        kecamatan: r.kecamatan,
        kota: r.kota,
      } : null,
    };

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const auth = await requireOperator(request);
    if ("response" in auth) return auth.response;

    const { reportId } = await params;
    const parsedReportId = Number(reportId);
    if (!Number.isInteger(parsedReportId) || parsedReportId <= 0) {
      return NextResponse.json({ message: "ID laporan tidak valid." }, { status: 400 });
    }
    const { status: newStatus, adminNotes, kelurahanId, categoryId, needsBackup } = await request.json();
    const parsedKelurahanId = kelurahanId === undefined ? undefined : Number(kelurahanId);
    const parsedCategoryId = categoryId === undefined ? undefined : Number(categoryId);
    const parsedNeedsBackup = needsBackup === undefined ? undefined : Boolean(needsBackup);

    if (newStatus !== undefined && !ALLOWED_REPORT_STATUS.has(String(newStatus))) {
      return NextResponse.json({ message: "Status laporan tidak valid." }, { status: 400 });
    }

    // Ambil status saat ini untuk menghindari double update & double notif
    const currentReport = await queryRow<{ status: string }>(
      'SELECT status FROM reports WHERE id = ?',
      [parsedReportId]
    );

    if (!currentReport) {
      return NextResponse.json({ message: `Laporan dengan ID ${reportId} tidak ditemukan.` }, { status: 404 });
    }

    // Mencegah double click / duplicate status update
    if (newStatus && currentReport.status === newStatus) {
       return NextResponse.json({ message: `Laporan sudah berstatus ${newStatus}.` }, { status: 200 });
    }

    if (adminNotes !== undefined && (typeof adminNotes !== "string" || adminNotes.length > 1000)) {
      return NextResponse.json({ message: "Catatan petugas tidak valid." }, { status: 400 });
    }

    if (
      parsedKelurahanId !== undefined &&
      (!Number.isInteger(parsedKelurahanId) || parsedKelurahanId <= 0)
    ) {
      return NextResponse.json({ message: "Kelurahan tidak valid." }, { status: 400 });
    }

    if (
      parsedCategoryId !== undefined &&
      (!Number.isInteger(parsedCategoryId) || parsedCategoryId <= 0)
    ) {
      return NextResponse.json({ message: "Kategori tidak valid." }, { status: 400 });
    }

    // Build dynamic SQL update
    const updates: string[] = [];
    const args: any[] = [];

    if (newStatus) {
      updates.push('status = ?');
      args.push(newStatus);

      // Sinkronisasi status_petugas jika laporan diakhiri oleh operator (selesai/palsu)
      // agar tugas tidak nyangkut di aplikasi mobile petugas piket
      if (['completed', 'selesai', 'false_report', 'false', 'dibatalkan'].includes(newStatus)) {
        updates.push('status_petugas = ?');
        args.push(newStatus === 'selesai' ? 'completed' : newStatus === 'false' ? 'false_report' : newStatus);
      }
    }

    if (adminNotes !== undefined) {
      updates.push('admin_notes = ?');
      args.push(adminNotes);
    }

    if (kelurahanId !== undefined) {
      updates.push('kelurahan_id = ?');
      args.push(parsedKelurahanId);
    }

    if (categoryId !== undefined) {
      updates.push('category_id = ?');
      args.push(parsedCategoryId);
    }

    if (needsBackup !== undefined) {
      updates.push('needs_backup = ?');
      args.push(parsedNeedsBackup ? 1 : 0);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { message: "Tidak ada data yang diubah." },
        { status: 400 }
      );
    }

    const sql = `UPDATE reports SET ${updates.join(', ')} WHERE id = ?`;
    args.push(parsedReportId);

    const rowsAffected = await execute(sql, args);

    if (rowsAffected === 0) {
      return NextResponse.json(
        { message: `Laporan dengan ID ${reportId} tidak ditemukan.` },
        { status: 404 }
      );
    }

    // Ambil data report dan user untuk notifikasi
    const report = await queryRow<{
      user_id: number | null;
      fire_latitude: number;
      fire_longitude: number;
      contact: string | null;
    }>(
      'SELECT user_id, fire_latitude, fire_longitude, contact FROM reports WHERE id = ?',
      [parsedReportId]
    );

    if (report && newStatus) {
      const canonicalStatus = normalizeNotificationStatus(String(newStatus));

      const user = report.user_id ? await queryRow<{ name: string; email: string; phone_number: string }>(
        'SELECT name, email, phone_number FROM users WHERE id = ?',
        [report.user_id]
      ) : null;

      // Status labels untuk notifikasi (tanpa emoji)
      const statusLabels: Record<string, string> = {
        pending: 'Menunggu Verifikasi',
        submitted: 'Baru Dikirim',
        approved: 'Laporan Disetujui',
        verified: 'Terverifikasi',
        in_progress: 'Sedang Ditangani',
        diproses: 'Sedang Diproses',
        dispatched: 'Unit Dikirim',
        dikirim: 'Tim Dikirim',
        arrived: 'Unit Tiba',
        ditangani: 'Sedang Ditangani',
        completed: 'Selesai',
        selesai: 'Selesai',
        dibatalkan: 'Dibatalkan',
        false_report: 'Laporan Palsu',
        false: 'Laporan Palsu',
        escalated_to_damkar: 'Butuh Damkar',
      };

      const statusLabel = statusLabels[canonicalStatus] || statusLabels[newStatus] || newStatus;

      // BARU: Simpan notifikasi ke database untuk web (hanya jika ada user_id)
      if (report.user_id) {
        let dbNotificationId: number | undefined;
        try {
          const { executeAndGetLastInsertId, formatDateForMySQL } = await import('@/lib/db');
          const currentTimestamp = formatDateForMySQL(new Date());

          const notifTitle = _getNotifTitle(canonicalStatus);
          let notifMessage = _getNotifBody(canonicalStatus);
          if (adminNotes) {
            notifMessage += `\n\nCatatan petugas: ${adminNotes}`;
          }

          dbNotificationId = await executeAndGetLastInsertId(
            `INSERT INTO notifications (user_id, title, message, type, report_id, is_read, created_at) 
             VALUES (?, ?, ?, ?, ?, FALSE, ?)`,
            [report.user_id, notifTitle, notifMessage, 'status_update', parsedReportId, currentTimestamp]
          );
        } catch (notifError) {
          console.error('Error creating notification:', notifError);
        }

        // Trigger push notification asynchronously (hybrid mode: push + inbox table)
        void import('@/services/notification-service')
          .then(({ sendReportStatusNotification }) =>
            sendReportStatusNotification(parsedReportId, report.user_id as number, canonicalStatus, dbNotificationId)
          )
          .catch((pushError) => {
            console.error('Error triggering push notification:', pushError);
          });
      }

      // Logika Pengiriman Email (Untuk Selesai & Laporan Palsu sebagai arsip)
      if (user && user.email && (canonicalStatus === 'completed' || canonicalStatus === 'false_report')) {
        sendStatusUpdateEmail(
          user.email,
          user.name,
          parsedReportId,
          canonicalStatus,
          adminNotes
        );
      }

      // Logika Pengiriman WhatsApp (Untuk Urgensi: Unit Berangkat & Laporan Palsu)
      if (ENABLE_WHATSAPP && (canonicalStatus === 'in_progress' || canonicalStatus === 'false_report')) {
        const address = await getAddressFromCoordinates(report.fire_latitude, report.fire_longitude);
        
        if (user && user.phone_number) {
          sendWhatsAppReportUpdate(
            user.phone_number,
            user.name,
            parsedReportId,
            statusLabel,
            address,
            adminNotes
          );
        } else if (!report.user_id && report.contact) {
          sendWhatsAppReportUpdate(
            report.contact,
            "Pelapor",
            parsedReportId,
            statusLabel,
            address,
            adminNotes
          );
        }
      }
    }

    // Broadcast status update via WebSocket
    const wss = global.wss;
    if (wss) {
      wss.broadcast(
        JSON.stringify({
          type: "STATUS_UPDATE",
          payload: { 
            reportId: parsedReportId, 
            newStatus: newStatus || undefined,
            needsBackup: parsedNeedsBackup
          },
        })
      );
    }

    return NextResponse.json({
      message: `Data laporan #${reportId} berhasil diperbarui.`,
    });
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const auth = await requireOperator(request);
    if ("response" in auth) return auth.response;

    const { reportId } = await params;
    const parsedReportId = Number(reportId);
    if (!Number.isInteger(parsedReportId) || parsedReportId <= 0) {
      return NextResponse.json({ message: "ID laporan tidak valid." }, { status: 400 });
    }

    // Cek laporan ada
    const existing = await queryRow(
      "SELECT id, media_url FROM reports WHERE id = ?",
      [parsedReportId]
    ) as any;

    if (!existing) {
      return NextResponse.json({ message: "Laporan tidak ditemukan." }, { status: 404 });
    }

    // Hapus notifikasi terkait laporan ini
    await execute("DELETE FROM notifications WHERE report_id = ?", [parsedReportId]);

    // Hapus laporan
    await execute("DELETE FROM reports WHERE id = ?", [parsedReportId]);

    // Broadcast ke operator via WebSocket agar list terupdate
    const wss = global.wss;
    if (wss) {
      wss.broadcast(
        JSON.stringify({ type: "REPORT_DELETED", payload: { reportId: parsedReportId } })
      );
    }

    return NextResponse.json({
      success: true,
      message: `Laporan #${parsedReportId} berhasil dihapus.`,
    });
  } catch (error) {
    console.error("Error deleting report:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}
