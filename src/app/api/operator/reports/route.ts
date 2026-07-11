import { NextRequest, NextResponse } from 'next/server';
import { queryRows, execute } from '@/lib/db';
import { requireOperator } from '@/lib/api-security';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireOperator(request);
    if ("response" in auth) return auth.response;

    const reports = await queryRows(
      `SELECT r.id, r.fire_latitude, r.fire_longitude, r.reporter_latitude, r.reporter_longitude, 
              r.status, r.created_at, r.media_url, r.notes, r.contact, r.description,
              r.assigned_petugas_id, r.dispatched_at, r.accepted_at, r.arrived_at, r.completed_at, 
              r.status_petugas, r.completion_photo_url, r.response_time_seconds,
              p.name as assigned_petugas_name,
              u.phone_number, 
              c.id as category_id, c.name as category_name, c.icon as category_icon, c.color as category_color,
              k.id as kelurahan_id, k.name as kelurahan_name, k.kecamatan, k.kota
       FROM reports r 
       JOIN users u ON r.user_id = u.id
       LEFT JOIN disaster_categories c ON r.category_id = c.id
       LEFT JOIN kelurahan k ON r.kelurahan_id = k.id
       LEFT JOIN users p ON r.assigned_petugas_id = p.id
       ORDER BY r.created_at DESC`
    );
    return NextResponse.json(reports);
  } catch (error) {
    console.error('[GET /api/operator/reports]', error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireOperator(request);
    if ("response" in auth) return auth.response;

    // Hapus notifikasi terkait semua laporan terlebih dahulu
    await execute('DELETE FROM notifications WHERE report_id IS NOT NULL');
    // Hapus semua laporan
    await execute('DELETE FROM reports');
    await execute('ALTER TABLE reports AUTO_INCREMENT = 1');

    return NextResponse.json({ message: 'Semua laporan berhasil dihapus.' });
  } catch (error) {
    console.error('[DELETE /api/operator/reports]', error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
