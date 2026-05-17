import { NextRequest, NextResponse } from 'next/server';
import { queryRows, queryRow } from '@/lib/db';
import { getAuthPayloadFromRequest, handleCorsOptions, jsonWithCors } from '@/lib/cors';

export const revalidate = 0;

// OPTIONS: CORS preflight
export async function OPTIONS() {
  return handleCorsOptions();
}

async function getAuthPayload(request: NextRequest) {
  return getAuthPayloadFromRequest(request);
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayload(request);

    if (user.isOperator) {
      return jsonWithCors({ message: 'Endpoint ini hanya untuk pengguna biasa.' }, { status: 403 });
    }

    if (!user.id) {
      return jsonWithCors({ message: 'User ID tidak valid.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('id');

    // Jika ada reportId, ambil detail satu laporan
    if (reportId) {
      const report = await queryRow(
        `SELECT 
          r.id, 
          r.fire_latitude, 
          r.fire_longitude,
          r.reporter_latitude,
          r.reporter_longitude, 
          COALESCE(r.description, r.address, 'Tidak ada deskripsi') as description,
          r.address,
          r.status, 
          r.created_at, 
          COALESCE(r.updated_at, r.created_at) as updated_at, 
          r.admin_notes, 
          r.media_url as photo_url,
          r.notes,
          r.contact,
          u.phone_number as user_phone,
          c.id as category_id,
          c.name as category_name,
          c.icon as category_icon,
          k.id as kelurahan_id,
          k.name as kelurahan_name,
          k.kecamatan
        FROM reports r 
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN disaster_categories c ON r.category_id = c.id
        LEFT JOIN kelurahan k ON r.kelurahan_id = k.id
        WHERE r.id = ? AND r.user_id = ?`,
        [reportId, user.id]
      );

      if (!report) {
        return jsonWithCors({ message: 'Laporan tidak ditemukan.' }, { status: 404 });
      }

      return jsonWithCors({ report });
    }

    // Jika tidak ada reportId, ambil semua laporan user
    const reports = await queryRows(
      `SELECT 
        r.id, 
        r.fire_latitude, 
        r.fire_longitude,
        r.reporter_latitude,
        r.reporter_longitude, 
        COALESCE(r.description, r.address, 'Tidak ada deskripsi') as description,
        r.address,
        r.status, 
        r.created_at, 
        COALESCE(r.updated_at, r.created_at) as updated_at, 
        r.admin_notes, 
        r.media_url as photo_url,
        r.notes,
        r.contact,
        c.id as category_id,
        c.name as category_name,
        c.icon as category_icon,
        k.id as kelurahan_id,
        k.name as kelurahan_name,
        k.kecamatan
      FROM reports r
      LEFT JOIN disaster_categories c ON r.category_id = c.id
      LEFT JOIN kelurahan k ON r.kelurahan_id = k.id
      WHERE r.user_id = ? 
      ORDER BY r.created_at DESC`,
      [user.id]
    );

    return jsonWithCors({ reports });

  } catch (error: any) {
    if (error.message?.includes('autentikasi') || error.message?.includes('Token')) {
      return jsonWithCors({ message: 'Akses ditolak.' }, { status: 401 });
    }

    return jsonWithCors({
      message: 'Terjadi kesalahan pada server.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}