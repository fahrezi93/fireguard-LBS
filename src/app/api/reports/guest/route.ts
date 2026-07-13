import { NextRequest, NextResponse } from 'next/server';
import { executeAndGetLastInsertId } from '@/lib/db';
import { handleCorsOptions, jsonWithCors } from '@/lib/cors';

export const revalidate = 0;

export async function OPTIONS() {
  return handleCorsOptions();
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Ambil data
    const lat = formData.get('latitude') as string;
    const lng = formData.get('longitude') as string;
    const desc = formData.get('description') as string;
    const catId = formData.get('category_id') as string;
    const phone = formData.get('phone_number') as string;
    const photoUrl = formData.get('photo_url') as string;
    const reporterName = formData.get('reporter_name') as string;
    const kelurahanId = formData.get('kelurahan_id') as string;
    const address = formData.get('address') as string;

    // STRICT VALIDATION
    if (!lat || !lng || !desc || !catId || !phone || !photoUrl || !reporterName || !kelurahanId || !address) {
      return jsonWithCors(
        { message: 'Semua kolom (Nama, Foto, Nomor WA, Kategori, Kelurahan, Alamat, Lokasi, Deskripsi) wajib diisi!' },
        { status: 400 }
      );
    }

    // Validasi Nomor WA (Sederhana: harus angka, minimal 10 digit, maks 15)
    const phoneRegex = /^[0-9]{10,15}$/;
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      return jsonWithCors(
        { message: 'Format Nomor WA tidak valid (harus 10-15 digit angka).' },
        { status: 400 }
      );
    }

    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.substring(1);
    }

    // Insert ke tabel reports dengan user_id = NULL dan mengisi guest_name
    const newReportId = await executeAndGetLastInsertId(
      `INSERT INTO reports (
        user_id, guest_name, fire_latitude, fire_longitude, 
        reporter_latitude, reporter_longitude, 
        description, address, status, contact, 
        category_id, kelurahan_id, media_url
      ) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
      [
        reporterName.trim(),
        parseFloat(lat),
        parseFloat(lng),
        parseFloat(lat),
        parseFloat(lng),
        desc.trim(),
        address,
        cleanPhone,
        parseInt(catId, 10),
        parseInt(kelurahanId, 10),
        photoUrl
      ]
    );

    // Broadcast ke Operator via WebSocket
    const wss = global.wss;
    if (wss) {
      const payload = {
        id: newReportId,
        user_id: null,
        fire_latitude: parseFloat(lat),
        fire_longitude: parseFloat(lng),
        description: desc.trim(),
        address: address,
        status: 'pending',
        contact: cleanPhone,
        category_id: parseInt(catId, 10),
        kelurahan_id: parseInt(kelurahanId, 10),
        media_url: photoUrl,
        created_at: new Date().toISOString()
      };

      wss.broadcast(JSON.stringify({
        type: 'NEW_REPORT',
        payload: payload
      }));
    }

    return jsonWithCors({
      success: true,
      message: 'Laporan Darurat berhasil dikirim!',
      reportId: newReportId
    });

  } catch (error: any) {
    console.error('Guest Report Error:', error);
    return jsonWithCors(
      { message: 'Terjadi kesalahan pada server saat memproses laporan.' },
      { status: 500 }
    );
  }
}
