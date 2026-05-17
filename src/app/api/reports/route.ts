import { NextRequest } from "next/server";
import { executeAndGetLastInsertId, formatDateForMySQL, queryRow } from "@/lib/db";
import { getAuthPayloadFromRequest, handleCorsOptions, jsonWithCors } from "@/lib/cors";
import { enforceRateLimit } from "@/lib/rate-limit";

// Upload gambar ke Cloudinary menggunakan unsigned upload preset
async function uploadToCloudinary(buffer: Buffer, filename: string): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary belum dikonfigurasi. Tambahkan CLOUDINARY_CLOUD_NAME dan CLOUDINARY_UPLOAD_PRESET ke environment variables.');
  }

  // Gunakan FormData bawaan Next.js/Browser
  const formData = new FormData();

  // Konversi buffer ke Blob agar FormData di Next.js/Node 18+ mengirimnya dengan benar sebagai multipart/form-data
  // Gunakan Uint8Array dari buffer untuk kompatibilitas tipe data Blob
  const blob = new Blob([new Uint8Array(buffer)]);

  formData.append('file', blob, filename);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'fireguard/reports');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[Cloudinary] Error Response (${response.status}):`, errText);
    throw new Error(`Cloudinary upload gagal: ${response.status} ${errText}`);
  }

  const data = await response.json();
  return data.secure_url as string;
}

// OPTIONS: CORS preflight
export async function OPTIONS() {
  return handleCorsOptions();
}

async function getAuthPayload(request: NextRequest) {
  return getAuthPayloadFromRequest(request);
}

export async function POST(request: NextRequest) {
  try {
    const limit = enforceRateLimit(request, "reports-submit", 20, 60_000);
    if (!limit.allowed) {
      return jsonWithCors(
        { message: "Terlalu banyak laporan dalam waktu singkat. Coba lagi sebentar." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) }, request }
      );
    }

    const user = await getAuthPayload(request);

    // Verify user exists in database
    const dbUser = await queryRow("SELECT id FROM users WHERE id = ?", [user.id]);

    if (!dbUser) {
      return jsonWithCors(
        { message: "User tidak ditemukan. Silakan login ulang." },
        { status: 401 }
      );
    }

    const userId = user.id;

    const formData = await request.formData();
    // Flutter sends snake_case field names
    const fireLatitude = (formData.get("fire_latitude") ?? formData.get("fireLatitude")) as string;
    const fireLongitude = (formData.get("fire_longitude") ?? formData.get("fireLongitude")) as string;
    const reporterLatitude = (formData.get("reporter_latitude") ?? formData.get("reporterLatitude")) as string | null;
    const reporterLongitude = (formData.get("reporter_longitude") ?? formData.get("reporterLongitude")) as string | null;
    const description = formData.get("description") as string | null;
    const address = formData.get("address") as string | null;
    const mediaFile = formData.get("media") as File | null;
    const notes = formData.get("notes") as string | null;
    const contact = formData.get("contact") as string | null;
    const categoryId = (formData.get("category_id") ?? formData.get("categoryId")) as string | null;
    const kelurahanId = (formData.get("kelurahan_id") ?? formData.get("kelurahanId")) as string | null;

    const fireLatNumber = Number(fireLatitude);
    const fireLngNumber = Number(fireLongitude);
    const reporterLatNumber = reporterLatitude ? Number(reporterLatitude) : null;
    const reporterLngNumber = reporterLongitude ? Number(reporterLongitude) : null;
    const parsedCategoryId = categoryId ? Number(categoryId) : 1;
    const parsedKelurahanId = kelurahanId ? Number(kelurahanId) : null;

    if (!fireLatitude || !fireLongitude) {
      return jsonWithCors(
        { message: "Data laporan tidak lengkap (lokasi kejadian wajib)." },
        { status: 400 }
      );
    }

    if (
      Number.isNaN(fireLatNumber) ||
      Number.isNaN(fireLngNumber) ||
      fireLatNumber < -90 ||
      fireLatNumber > 90 ||
      fireLngNumber < -180 ||
      fireLngNumber > 180
    ) {
      return jsonWithCors({ message: "Koordinat lokasi kejadian tidak valid." }, { status: 400, request });
    }

    if (
      reporterLatNumber !== null &&
      (Number.isNaN(reporterLatNumber) || reporterLatNumber < -90 || reporterLatNumber > 90)
    ) {
      return jsonWithCors({ message: "Koordinat pelapor (latitude) tidak valid." }, { status: 400, request });
    }

    if (
      reporterLngNumber !== null &&
      (Number.isNaN(reporterLngNumber) || reporterLngNumber < -180 || reporterLngNumber > 180)
    ) {
      return jsonWithCors({ message: "Koordinat pelapor (longitude) tidak valid." }, { status: 400, request });
    }

    if (!Number.isInteger(parsedCategoryId) || parsedCategoryId <= 0) {
      return jsonWithCors({ message: "Kategori tidak valid." }, { status: 400, request });
    }

    if (parsedKelurahanId !== null && (!Number.isInteger(parsedKelurahanId) || parsedKelurahanId <= 0)) {
      return jsonWithCors({ message: "Kelurahan tidak valid." }, { status: 400, request });
    }

    // Upload dan kompresi file jika ada (opsional) — menggunakan Cloudinary
    let mediaUrl: string | null = null;
    if (mediaFile && mediaFile.size > 0) {
      const originalBuffer = Buffer.from(await mediaFile.arrayBuffer());
      const isImage = mediaFile.type.startsWith('image/');

      let finalBuffer: Buffer = originalBuffer;
      let extension = mediaFile.name.split('.').pop() || 'jpg';

      // Kompresi hanya untuk gambar sebelum upload ke Cloudinary
      if (isImage) {
        try {
          const sharp = (await import('sharp')).default;
          finalBuffer = await sharp(originalBuffer)
            .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();
          extension = 'jpg';
          console.log(`[Media] Compressed: ${originalBuffer.length} -> ${finalBuffer.length} bytes`);
        } catch (compressError) {
          console.error('[Media] Compression failed, using original:', compressError);
          finalBuffer = originalBuffer;
        }
      }

      const filename = `${Date.now()}-report.${extension}`;
      // Upload ke Cloudinary (external storage — berfungsi di VPS maupun environment lain)
      mediaUrl = await uploadToCloudinary(finalBuffer, filename);
      console.log(`[Media] Uploaded to Cloudinary: ${mediaUrl}`);
    }

    const currentTimestamp = formatDateForMySQL(new Date());

    // Insert report dengan category_id dan kelurahan_id
    let reportId: number;
    try {
      reportId = await executeAndGetLastInsertId(
        "INSERT INTO reports (user_id, fire_latitude, fire_longitude, reporter_latitude, reporter_longitude, description, address, media_url, notes, contact, category_id, kelurahan_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          userId,
          fireLatNumber,
          fireLngNumber,
          reporterLatNumber,
          reporterLngNumber,
          description,
          address,
          mediaUrl,
          notes,
          contact,
          parsedCategoryId,
          parsedKelurahanId,
          'pending',
          currentTimestamp
        ]
      );
    } catch (dbError: any) {
      // Fallback: insert without category_id if column doesn't exist
      if (dbError.message?.includes('category_id') || dbError.message?.includes('no column')) {
        reportId = await executeAndGetLastInsertId(
          "INSERT INTO reports (user_id, fire_latitude, fire_longitude, reporter_latitude, reporter_longitude, description, address, media_url, notes, contact, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            userId,
            fireLatNumber,
            fireLngNumber,
            reporterLatNumber,
            reporterLngNumber,
            description,
            address,
            mediaUrl,
            notes,
            contact,
            'pending',
            currentTimestamp
          ]
        );
      } else {
        throw dbError;
      }
    }

    // Kirim response segera setelah insert berhasil
    const responsePayload = jsonWithCors(
      { message: "Laporan berhasil dikirim!", reportId },
      { status: 201 }
    );

    // WebSocket broadcast ke operator — jalankan async tanpa blokir response
    const wss = global.wss;
    if (wss) {
      void (async () => {
        try {
          const { queryRow: qr } = await import('@/lib/db');
          const fullReport = await qr(
            `SELECT r.id, r.fire_latitude, r.fire_longitude, r.reporter_latitude, r.reporter_longitude,
                    r.status, r.created_at, r.media_url, r.description, r.address, r.notes, r.contact,
                    u.phone_number,
                    c.id as category_id, c.name as category_name, c.icon as category_icon, c.color as category_color,
                    k.id as kelurahan_id, k.name as kelurahan_name, k.kecamatan, k.kota
             FROM reports r
             JOIN users u ON r.user_id = u.id
             LEFT JOIN disaster_categories c ON r.category_id = c.id
             LEFT JOIN kelurahan k ON r.kelurahan_id = k.id
             WHERE r.id = ?`,
            [reportId]
          );
          wss.broadcast(
            JSON.stringify({
              type: "NEW_REPORT",
              payload: fullReport ?? {
                id: reportId,
                fire_latitude: fireLatNumber,
                fire_longitude: fireLngNumber,
                reporter_latitude: reporterLatNumber,
                reporter_longitude: reporterLngNumber,
                media_url: mediaUrl,
                status: "pending",
                created_at: currentTimestamp,
                phone_number: user.phone,
              },
            })
          );
        } catch (wsErr) {
          console.error('[WebSocket] Gagal broadcast laporan baru:', wsErr);
        }
      })();
    }

    return responsePayload;
  } catch (error: any) {
    console.error('[POST /api/reports] Error:', error?.message ?? error);

    if (error.message?.includes("autentikasi")) {
      return jsonWithCors({ message: "Akses ditolak." }, { status: 401 });
    }

    if (error.message?.includes("Cloudinary")) {
      return jsonWithCors(
        { message: "Gagal mengupload foto. Coba lagi atau kirim tanpa foto." },
        { status: 502 }
      );
    }

    return jsonWithCors(
      {
        message: "Terjadi kesalahan pada server.",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
