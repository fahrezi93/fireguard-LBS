import { NextRequest } from "next/server";
import { queryRow, queryRows, execute } from "@/lib/db";
import { getAuthPayloadFromRequest, handleCorsOptions, jsonWithCors } from "@/lib/cors";
import { getMessaging } from "@/lib/firebase-admin";

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthPayloadFromRequest(request);

    if (user.role !== 'petugas') {
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

    // Ambil laporan
    const report = await queryRow<{ id: number, assigned_petugas_id: number, dispatched_at: Date, user_id: number }>(
      "SELECT id, assigned_petugas_id, dispatched_at, user_id FROM reports WHERE id = ?",
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
      query += ", arrived_at = NOW()";
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
      }
    }

    query += " WHERE id = ?";
    params.push(reportId);

    await execute(query, params);

    // Kirim notifikasi ke pelapor jika laporan selesai atau palsu
    if (status === 'completed' || status === 'false_report') {
      try {
        const tokens = await queryRows<{ device_token: string }>(
          "SELECT device_token FROM device_tokens WHERE user_id = ? AND is_active = TRUE",
          [report.user_id]
        );
        
        if (tokens.length > 0) {
          const messaging = await getMessaging();
          if (messaging) {
            const tokenStrings = tokens.map(t => t.device_token);
            const bodyMessage = status === 'completed' 
              ? "Laporan Selesai! Api telah berhasil dipadamkan oleh petugas." 
              : "Laporan dibatalkan karena terindikasi sebagai laporan palsu.";
            
            await messaging.sendEachForMulticast({
              tokens: tokenStrings,
              notification: {
                title: status === 'completed' ? "✅ Laporan Selesai" : "❌ Laporan Palsu",
                body: bodyMessage,
              },
              data: {
                type: "status_update",
                reportId: String(reportId),
              },
              android: {
                priority: "high",
                notification: {
                  channelId: "siagabencana_general"
                }
              }
            });
          }
        }
      } catch (notifErr) {
        console.error("Gagal mengirim notifikasi ke pelapor:", notifErr);
        // Lanjutkan eksekusi meskipun notifikasi gagal
      }
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
