import { NextRequest, NextResponse } from 'next/server';
import { serialize } from 'cookie';
import { handleCorsOptions, corsHeaders } from '@/lib/cors';

const COOKIE_NAME = 'auth_token';

// OPTIONS: CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

export async function POST(request: NextRequest) {
  // Buat cookie yang sudah kedaluwarsa untuk menghapusnya dari browser
  const serializedCookie = serialize(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // Set ke 0 untuk menghapus cookie
    expires: new Date(0), // Juga set expires ke masa lalu
  });

  const response = new NextResponse(JSON.stringify({ message: 'Logout berhasil.' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': serializedCookie,
      // Header untuk mencegah caching
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...corsHeaders(request),
    },
  });

  return response;
}
