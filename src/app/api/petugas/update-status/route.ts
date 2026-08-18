import { NextRequest } from "next/server";
import { queryRow, queryRows, execute } from "@/lib/db";
import { getAuthPayloadFromRequest, handleCorsOptions, jsonWithCors } from "@/lib/cors";
import { getMessaging } from "@/lib/firebase-admin";
import { getAddressFromCoordinates } from "@/lib/geo";
import { sendStatusUpdateEmail } from "@/lib/email";
import { sendWhatsAppReportUpdate } from "@/lib/whatsapp";
import { executeAndGetLastInsertId, formatDateForMySQL } from "@/lib/db";

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthPayloadFromRequest(request);

    if (user.role?.toUpperCase() !== 'PETUGAS') {
      return jsonWithCors({ message: "Hanya petugas yang bisa update status." }, { status: 403, request });
    }

    let reportId: string | null = null;
    let status: string | null = null;
    let photoUrl: string | null = null;
    let notes: string | null = null;

    // Cek apakah request berupa multipart/form-data atau JSON
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      reportId = formData.get('reportId') as string;
      status = formData.get('status') as string;
      notes = formData.get('notes') as string | null;

      const file = formData.get('file') as File | null;
      if (file && file.size > 0) {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

        if (cloudName && uploadPreset) {
          const buffer = await file.arrayBuffer();
          const uploadFormData = new FormData();
          const blob = new Blob([new Uint8Array(buffer)]);
          uploadFormData.append('file', blob, file.name);
          uploadFormData.append('upload_preset', uploadPreset);
          uploadFormData.append('folder', 'siagabencana/completion_photos');

          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            { method: 'POST', body: uploadFormData }
          );

          if (response.ok) {
            const data = await response.json();
            photoUrl = data.secure_url;
          } else {
            console.error("Gagal upload ke Cloudinary:", await response.text());
          }
        }
      }
    } else {
      const body = await request.json();
      reportId = body.reportId;
      status = body.status;
      photoUrl = body.photoUrl;
      notes = body.notes;
    }

    if (!reportId || !status) {
      return jsonWithCors({ message: "ID Laporan dan status wajib diisi." }, { status: 400, request });
    }

    const validStatuses = ['arrived', 'completed', 'false_report', 'escalated_to_damkar'];
    if (!validStatuses.includes(status)) {
      return jsonWithCors({ message: "Status tidak valid." }, { status: 400, request });
    }

    if (status === 'completed' && !photoUrl) {
      return jsonWithCors({ message: "Foto bukti penyelesaian wajib dilampirkan." }, { status: 400, request });
    }

    // Ambil laporan beserta data user (pelapor)
    const report = await queryRow<any>(
      `SELECT r.id, r.assigned_petugas_id, r.dispatched_at, r.user_id, r.fire_latitude, r.fire_longitude,
              u.name as user_name, u.email as user_email, u.phone_number as user_phone
       FROM reports r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [reportId]
    );

    if (!report) {
      return jsonWithCors({ message: "Laporan tidak ditemukan." }, { status: 404, request });
    }

    if (report.assigned_petugas_id !== user.id) {
      return jsonWithCors({ message: "Anda tidak ditugaskan untuk laporan ini." }, { status: 403, request });
    }

    let query = "UPDATE reports SET status_petugas = ?";
    const params: any[] = [status];

    if (status === 'arrived') {
      query += ", arrived_at = NOW(), status = 'arrived'";
    } else if (['completed', 'false_report', 'escalated_to_damkar'].includes(status)) {
      query += ", completed_at = NOW()";

      // Calculate response time in query: TIMESTAMPDIFF(SECOND, dispatched_at, NOW())
      if (report.dispatched_at) {
        query += ", response_time_seconds = TIMESTAMPDIFF(SECOND, dispatched_at, NOW())";
      }

      if (notes) {
        query += ", petugas_notes = ?";
        params.push(notes);
      }

      if (status === 'completed') {
        query += ", completion_photo_url = ?";
        params.push(photoUrl);
        query += ", status = 'completed'";
      } else if (status === 'false_report') {
        query += ", status = 'false_report'";
      } else if (status === 'escalated_to_damkar') {
        query += ", status = 'escalated_to_damkar'";
      }
    }

    query += " WHERE id = ?";
    params.push(reportId);

    await execute(query, params);

    // Kirim notifikasi ke pelapor jika laporan selesai atau palsu
    if (status === 'completed' || status === 'false_report') {
      try {
        const canonicalStatus = status === 'completed' ? 'completed' : 'false_report';

        // Title dan message standar untuk notifikasi
        const notifTitle = canonicalStatus === 'completed' ? 'Laporan Selesai' : 'Laporan Ditolak';
        let notifMessage = canonicalStatus === 'completed'
          ? 'Laporan Anda telah diselesaikan'
          : 'Laporan Anda ditandai sebagai laporan palsu';

        if (notes) {
          notifMessage += `\n\nCatatan petugas: ${notes}`;
        }

        // 1 & 2: Push Notif & DB Notif (hanya jika user terdaftar)
        if (report.user_id) {
          const currentTimestamp = formatDateForMySQL(new Date());
          let dbNotificationId: number | undefined;
          try {
            dbNotificationId = await executeAndGetLastInsertId(
              `INSERT INTO notifications (user_id, title, message, type, report_id, is_read, created_at) 
               VALUES (?, ?, ?, ?, ?, FALSE, ?)`,
              [report.user_id, notifTitle, notifMessage, 'status_update', reportId, currentTimestamp]
            );
          } catch (notifDbErr) {
            console.error('Error creating notification in DB:', notifDbErr);
          }

          // 2. Trigger FCM (hybrid mode)
          void import('@/services/notification-service')
            .then(({ sendReportStatusNotification }) =>
              sendReportStatusNotification(Number(reportId), report.user_id, canonicalStatus, dbNotificationId)
            )
            .catch((pushError) => {
              console.error('Error triggering push notification:', pushError);
            });
        }

        // 3. Logika Pengiriman Email (Selesai & Palsu)
        if (report.user_email) {
          sendStatusUpdateEmail(
            report.user_email,
            report.user_name,
            Number(reportId),
            canonicalStatus,
            notes || undefined
          );
        }

        // 4. Logika Pengiriman WhatsApp (Hanya untuk Laporan Palsu)
        const ENABLE_WHATSAPP = process.env.ENABLE_WHATSAPP === "true";
        if (ENABLE_WHATSAPP && canonicalStatus === 'false_report') {
          const address = await getAddressFromCoordinates(report.fire_latitude, report.fire_longitude);
          const statusLabel = 'Laporan Palsu';

          if (report.user_phone) {
            sendWhatsAppReportUpdate(
              report.user_phone,
              report.user_name,
              Number(reportId),
              statusLabel,
              address,
              notes || undefined
            );
          } else if (!report.user_id) {
            // Fetch contact directly from db if it wasn't fetched in the previous query
            const guestReport = await queryRow<any>("SELECT contact FROM reports WHERE id = ?", [reportId]);
            if (guestReport && guestReport.contact) {
              sendWhatsAppReportUpdate(
                guestReport.contact,
                "Pelapor",
                Number(reportId),
                statusLabel,
                address,
                notes || undefined
              );
            }
          }
        }
      } catch (notifErr) {
        console.error("Gagal memproses notifikasi:", notifErr);
      }
    }

    // Broadcast status update via WebSocket agar Dashboard Web terupdate
    const wss = global.wss;
    if (wss) {
      wss.broadcast(
        JSON.stringify({
          type: "STATUS_UPDATE",
          payload: { reportId: Number(reportId), newStatus: status === 'false_report' ? 'false_report' : status },
        })
      );
    }

    return jsonWithCors({
      success: true,
      message: `Status berhasil diubah menjadi ${status}.`
    }, { status: 200, request });

  } catch (error: any) {
    if (error.message?.includes("autentikasi") || error.message?.includes("Token")) {
      return jsonWithCors({ message: "Akses ditolak." }, { status: 401, request });
    }
    console.error("Update Status Error:", error);
    return jsonWithCors({
      success: false,
      message: "Terjadi kesalahan internal.",
    }, { status: 500, request });
  }
}
