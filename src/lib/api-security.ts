import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";
import { COOKIE_NAME } from "@/lib/session";
import { getJwtSecretKey } from "@/lib/secrets";

export type AuthPayload = {
  id: number;
  email?: string;
  name?: string;
  username?: string;
  phone?: string | null;
  isOperator?: boolean;
  iss?: string;
  aud?: string | string[];
  jti?: string;
};

const JWT_ISSUER = process.env.JWT_ISSUER || "siagabencana-web";
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "siagabencana-clients";

function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ message }, { status: 401 });
}

function forbidden(message = "Forbidden") {
  return NextResponse.json({ message }, { status: 403 });
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return request.cookies.get(COOKIE_NAME)?.value || null;
}

export async function verifyAuthToken(token: string): Promise<AuthPayload> {
  const secret = getJwtSecretKey();
  const { payload } = await jose.jwtVerify(token, secret, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
  return payload as unknown as AuthPayload;
}

export async function requireAuth(
  request: NextRequest
): Promise<{ payload: AuthPayload } | { response: NextResponse }> {
  const token = getTokenFromRequest(request);
  if (!token) {
    return { response: unauthorized("Token autentikasi tidak ditemukan.") };
  }

  try {
    const payload = await verifyAuthToken(token);
    if (!payload.id || Number.isNaN(Number(payload.id))) {
      return { response: unauthorized("Token tidak valid.") };
    }
    return { payload };
  } catch {
    return { response: unauthorized("Token tidak valid atau kedaluwarsa.") };
  }
}

export async function requireOperator(
  request: NextRequest
): Promise<{ payload: AuthPayload } | { response: NextResponse }> {
  const auth = await requireAuth(request);
  if ("response" in auth) {
    return auth;
  }

  if (auth.payload.isOperator !== true) {
    return { response: forbidden("Akses khusus operator.") };
  }

  return auth;
}

export function getJwtClaimConfig() {
  return {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  };
}

function getConfiguredOrigins(): string[] {
  const configured = (process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (process.env.NEXT_PUBLIC_BASE_URL) {
    configured.push(process.env.NEXT_PUBLIC_BASE_URL.trim());
  }

  if (process.env.NODE_ENV !== "production") {
    configured.push("http://localhost:3000", "http://127.0.0.1:3000");
  }

  return Array.from(new Set(configured));
}

export function resolveCorsOrigin(request: NextRequest): string | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;

  // In development, allow ANY localhost/127.0.0.1 origin for Flutter Web
  if (process.env.NODE_ENV !== "production") {
    if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
      return origin;
    }
  }

  const allowedOrigins = getConfiguredOrigins();
  if (allowedOrigins.includes(origin)) {
    return origin;
  }

  return null;
}
