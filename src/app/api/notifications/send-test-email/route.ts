/**
 * POST /api/notifications/send-test-email
 *
 * Endpoint untuk test kirim email via Resend.
 * Berguna untuk memverifikasi bahwa:
 *   1. RESEND_API_KEY sudah di-set dengan benar
 *   2. Domain sudah terverifikasi di Resend
 *   3. Email berhasil terkirim ke inbox
 *
 * Bisa diakses oleh user yang sudah login (web & mobile).
 *
 * Body (opsional):
 *   { "type": "otp" | "status" }  — default: "otp"
 */

import { NextRequest } from 'next/server';
import { handleCorsOptions, jsonWithCors, getAuthPayloadFromRequest } from '@/lib/cors';
import { sendEmailOTP, sendStatusUpdateEmail } from '@/lib/email';

export async function OPTIONS() {
  return handleCorsOptions();
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthPayloadFromRequest(request);

    // Pastikan ada email di payload
    const email = (user as any).email;
    if (!email) {
      return jsonWithCors(
        { success: false, message: 'Akun ini tidak memiliki email terdaftar.' },
        { status: 400, request },
      );
    }

    const body = await request.json().catch(() => ({}));
    const type: 'otp' | 'status' = body?.type === 'status' ? 'status' : 'otp';

    let result: { success: boolean; error?: string };

    if (type === 'status') {
      result = await sendStatusUpdateEmail(
        email,
        (user as any).name || 'Pengguna',
        9999,
        'in_progress',
        'Ini adalah email test dari FireGuard. Jika kamu menerima ini, konfigurasi Resend sudah benar.',
      );
    } else {
      result = await sendEmailOTP(email, '123456', 'login');
    }

    if (!result.success) {
      return jsonWithCors(
        {
          success: false,
          message: 'Gagal mengirim email. Cek RESEND_API_KEY dan verifikasi domain di Resend Dashboard.',
          error: result.error,
          hint: 'Pastikan RESEND_API_KEY sudah di-set di .env VPS dan domain sudah diverifikasi di https://resend.com/domains',
        },
        { status: 503, request },
      );
    }

    return jsonWithCors(
      {
        success: true,
        message: `Test email (${type}) berhasil dikirim ke ${email}`,
        email,
        type,
      },
      { status: 200, request },
    );
  } catch (error: any) {
    if (error?.message?.includes('autentikasi') || error?.message?.includes('Token')) {
      return jsonWithCors({ message: 'Akses ditolak.' }, { status: 401, request });
    }
    return jsonWithCors(
      { success: false, message: 'Terjadi kesalahan.', error: error?.message },
      { status: 500, request },
    );
  }
}
