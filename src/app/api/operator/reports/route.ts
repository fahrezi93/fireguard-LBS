import { NextRequest, NextResponse } from 'next/server';
import { queryRows, execute } from '@/lib/db';
import { requireAuth, requireOperator } from '@/lib/api-security';

// Hard cap untuk initial load dashboard operator/kelurahan. Tanpa ini, query
// lama (ORDER BY created_at DESC tanpa LIMIT) menarik SELURUH histori
// laporan setiap kali dashboard dibuka — di HP RAM rendah ini memicu OOM
// begitu jumlah laporan bertambah seiring waktu.
const DEFAULT_REPORTS_LIMIT = 100;
const MAX_REPORTS_LIMIT = 200;

// LIMIT/OFFSET divalidasi & di-clamp sebagai integer murni sebelum
// diselipkan ke SQL (bukan lewat placeholder `?` pool.execute) — beberapa
// versi driver mysql2 kurang konsisten meng-handle LIMIT/OFFSET sebagai
// prepared-statement parameter. Ini aman karena nilainya sudah dipastikan
// integer valid, bukan input string mentah dari user.
function parseBoundedInt(raw: string | null, fallback: number, max?: number): number {
  if (raw === null) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return max !== undefined ? Math.min(parsed, max) : parsed;
}

// Allowlist status yang valid — dipakai sebagai filter WHERE opsional untuk
// mendukung pagination klasik (Sebelumnya/Selanjutnya) di dashboard: tanpa
// filter status ikut di-apply di server, halaman ke-2+ pada status filter
// tertentu bisa tampak kosong padahal masih ada data di halaman lain.
const ALLOWED_STATUSES = new Set([
  'submitted', 'verified', 'dispatched', 'arrived', 'completed', 'false', 'false_report',
]);

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if ("response" in auth) return auth.response;

    const payload = auth.payload;
    const isOperator = payload.isOperator === true;
    const role = payload.role;

    if (!isOperator && role !== 'SUPER_ADMIN' && role !== 'KELURAHAN') {
      return NextResponse.json({ message: 'Akses ditolak.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseBoundedInt(searchParams.get('limit'), DEFAULT_REPORTS_LIMIT, MAX_REPORTS_LIMIT) || DEFAULT_REPORTS_LIMIT;
    const offset = parseBoundedInt(searchParams.get('offset'), 0);
    const statusParamRaw = searchParams.get('status');
    const statusFilter = statusParamRaw && ALLOWED_STATUSES.has(statusParamRaw) ? statusParamRaw : null;

    let query = `
       SELECT r.id, r.user_id, r.fire_latitude, r.fire_longitude, r.reporter_latitude, r.reporter_longitude, 
              r.status, r.created_at, r.media_url, r.notes, r.contact, r.description, r.address,
              r.guest_name, r.admin_notes, r.petugas_notes,
              r.assigned_petugas_id, r.dispatched_at, r.accepted_at, r.arrived_at, r.completed_at, 
              r.status_petugas, r.completion_photo_url, r.response_time_seconds, r.needs_backup,
              p.name as assigned_petugas_name,
              u.name as user_name, u.phone_number, u.email as user_email,
              c.id as category_id, c.name as category_name, c.icon as category_icon, c.color as category_color,
              k.id as kelurahan_id, k.name as kelurahan_name, k.kecamatan, k.kota
       FROM reports r 
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN disaster_categories c ON r.category_id = c.id
       LEFT JOIN kelurahan k ON r.kelurahan_id = k.id
       LEFT JOIN users p ON r.assigned_petugas_id = p.id
    `;

    const whereClauses: string[] = [];
    const args: any[] = [];
    if (role === 'KELURAHAN' && payload.kelurahan_id) {
      whereClauses.push('r.kelurahan_id = ?');
      args.push(payload.kelurahan_id);
    }
    if (statusFilter) {
      whereClauses.push('r.status = ?');
      args.push(statusFilter);
    }
    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')} `;
    }

    // Ambil satu baris ekstra (limit + 1) untuk mendeteksi apakah masih ada
    // halaman berikutnya, tanpa perlu query COUNT(*) terpisah.
    query += ` ORDER BY r.created_at DESC LIMIT ${limit + 1} OFFSET ${offset}`;

    const rows = await queryRows<any>(query, args);
    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;

    return NextResponse.json({ data, hasMore, limit, offset });
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
