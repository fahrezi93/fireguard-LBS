import { NextRequest } from 'next/server';
import { getAuthPayloadFromRequest, handleCorsOptions, jsonWithCors } from '@/lib/cors';
import { queryRow } from '@/lib/db';

export const dynamic = 'force-dynamic';

// OPTIONS: CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

export async function GET(request: NextRequest) {
  try {
    // Support dual-mode: Bearer token (Flutter) dan Cookie (Web)
    const payload = await getAuthPayloadFromRequest(request);

    // Jika token milik operator, ambil dari tabel operators
    if (payload.isOperator) {
      const operator = await queryRow<{ id: number; username: string }>(
        'SELECT id, username FROM operators WHERE id = ?',
        [payload.id]
      );
      if (!operator) {
        return jsonWithCors({ message: 'Operator tidak ditemukan.' }, { status: 404, request });
      }
      return jsonWithCors({ 
        id: operator.id, 
        name: operator.username, 
        role: 'operator', 
        isOperator: true 
      }, { request });
    }

    // Ambil data fresh dari database agar field seperti is_on_duty selalu up-to-date
    const user = await queryRow(
      'SELECT id, name, email, phone_number, is_verified, role, is_on_duty, created_at, kelurahan_id FROM users WHERE id = ?',
      [payload.id]
    );

    if (!user) {
      return jsonWithCors({ message: 'User tidak ditemukan.' }, { status: 404, request });
    }

    return jsonWithCors(user, { request });
    
  } catch (error) {
    return jsonWithCors({ message: 'Token tidak valid atau kedaluwarsa.' }, { status: 401, request });
  }
}
