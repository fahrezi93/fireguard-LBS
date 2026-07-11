import { NextRequest, NextResponse } from 'next/server';
import { queryRows } from '@/lib/db';
import { getAuthPayloadFromRequest } from '@/lib/cors';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthPayloadFromRequest(request);

    if (user.role !== 'operator' && user.role !== 'admin') {
      return NextResponse.json({ message: 'Akses ditolak' }, { status: 403 });
    }

    // Ambil petugas yang punya lokasi dan diupdate dalam 30 menit terakhir
    const locations = await queryRows(
      `SELECT id, name, last_latitude, last_longitude, last_location_update, is_on_duty 
       FROM users 
       WHERE role = 'petugas' 
         AND last_latitude IS NOT NULL 
         AND last_longitude IS NOT NULL
         AND last_location_update >= NOW() - INTERVAL 30 MINUTE`
    );

    return NextResponse.json(locations);
  } catch (error: any) {
    console.error('Error fetching petugas locations:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
