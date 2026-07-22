import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME } from "@/lib/session";
import { verifyAuthToken } from "@/lib/api-security";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  const publicPaths = ["/", "/onboarding", "/terms", "/privacy", "/lapor-cepat", "/api/reports/guest", "/download"];
  const authPaths = ["/login", "/register", "/operator/login", "/onboarding", "/reset-password"];

  // Izinkan akses ke API, file Next.js, dan static files
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") // File dengan extension (.js, .css, .png, dll)
  ) {
    return NextResponse.next();
  }

  // Jika user sudah login, jangan izinkan kembali ke halaman auth.
  if (authPaths.includes(pathname) && token) {
    try {
      const payload = await verifyAuthToken(token);
      const isOperator = payload.isOperator === true;
      return NextResponse.redirect(new URL(isOperator ? "/operator/dashboard" : "/dashboard", request.url));
    } catch {
      const response = NextResponse.next();
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
  }

  // Halaman publik yang tidak memerlukan login
  if (publicPaths.includes(pathname) || authPaths.includes(pathname) || pathname.startsWith("/edukasi")) {
    return NextResponse.next();
  }

  // Jika tidak ada token, redirect ke halaman login yang sesuai
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.startsWith("/operator")
      ? "/operator/login"
      : "/login";
    return NextResponse.redirect(url);
  }

  // Jika ada token, verifikasi
  try {
    const payload = await verifyAuthToken(token);
    const isOperator = payload.isOperator === true;

    // Jika mencoba mengakses rute operator
    if (pathname.startsWith("/operator")) {
      if (isOperator) {
        return NextResponse.next(); // Akses diizinkan untuk operator
      } else {
        // Jika pengguna biasa mencoba akses, redirect ke halaman utama mereka
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    // Jika mencoba mengakses rute pengguna biasa
    if (isOperator) {
      // Jika operator mencoba akses, redirect ke dasbor mereka
      return NextResponse.redirect(new URL("/operator/dashboard", request.url));
    } else {
      return NextResponse.next(); // Akses diizinkan untuk pengguna biasa
    }
  } catch (err) {
    // Jika token tidak valid, hapus dan redirect ke login
    const url = request.nextUrl.clone();
    url.pathname = pathname.startsWith("/operator")
      ? "/operator/login"
      : "/login";
    const response = NextResponse.redirect(url);
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}

// Tentukan path mana saja yang akan dijalankan oleh middleware
export const config = {
  matcher: [
    /*
     * Cocokkan semua path KECUALI yang dimulai dengan:
     * - _next/static (file statis)
     * - _next/image (file optimasi gambar)
     * - favicon.ico (file ikon)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
