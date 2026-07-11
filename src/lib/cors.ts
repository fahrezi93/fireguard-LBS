import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getTokenFromRequest as getToken, resolveCorsOrigin } from './api-security';

/**
 * Extract JWT token dari Bearer header (Flutter) ATAU cookie (Web).
 * Prioritas: Bearer header > Cookie
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  return getToken(request);
}

/**
 * Verifikasi token dan kembalikan payload user.
 * Support dual-mode: Bearer token (Flutter) dan Cookie (Web).
 */
export async function getAuthPayloadFromRequest(request: NextRequest) {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    throw new Error('Token autentikasi tidak ditemukan.');
  }
  return auth.payload as { id: number; email: string; name: string; phone?: string; isOperator?: boolean; role?: string };
}

/**
 * CORS response headers untuk Flutter mobile access.
 */
export function corsHeaders(request?: NextRequest): Record<string, string> {
  const allowedOrigin = request ? resolveCorsOrigin(request) : null;
  const fallbackOrigin =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.NODE_ENV !== "production" ? "http://localhost:3000" : "null");
  return {
    'Access-Control-Allow-Origin': allowedOrigin || fallbackOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

/**
 * Handle OPTIONS preflight request.
 */
export function handleCorsOptions(request?: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request) });
}

/**
 * Wrap NextResponse.json with CORS headers.
 */
export function jsonWithCors(
  data: any,
  init?: { status?: number; headers?: Record<string, string>; request?: NextRequest }
) {
  const headers = { ...corsHeaders(init?.request), ...(init?.headers || {}) };
  return NextResponse.json(data, { status: init?.status || 200, headers });
}
