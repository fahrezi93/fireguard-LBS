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
      const rawRole = payload.role as string | undefined;
      const role = rawRole?.toUpperCase();

      if (isOperator) {
        return NextResponse.redirect(new URL("/operator/dashboard", request.url));
      } else if (role === "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      } else if (role === "KELURAHAN") {
        return NextResponse.redirect(new URL("/kelurahan/dashboard", request.url));
      } else if (role === "PETUGAS") {
        return NextResponse.redirect(new URL("/petugas/dashboard", request.url));
      } else {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
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
    const rawRole = payload.role as string | undefined;
    const role = rawRole?.toUpperCase();

    // Proteksi rute Admin
    if (pathname.startsWith("/admin")) {
      if (role === "SUPER_ADMIN") {
        return NextResponse.next();
      } else {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    // Proteksi rute Kelurahan
    // Sesuai Access Matrix: SUPER_ADMIN dan OPERATOR juga bisa lihat Dashboard Kelurahan
    if (pathname.startsWith("/kelurahan")) {
      if (role === "KELURAHAN" || role === "SUPER_ADMIN" || isOperator) {
        return NextResponse.next();
      } else {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    // Proteksi rute Operator
    if (pathname.startsWith("/operator")) {
      if (isOperator || role === "SUPER_ADMIN") {
        return NextResponse.next();
      } else {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    // Proteksi rute Petugas
    if (pathname.startsWith("/petugas")) {
      if (role === "PETUGAS" || role === "SUPER_ADMIN" || isOperator) {
        return NextResponse.next();
      } else {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    // Jika mencoba mengakses rute pengguna biasa
    if (isOperator) {
      return NextResponse.redirect(new URL("/operator/dashboard", request.url));
    } else if (role === "SUPER_ADMIN") {
      if (pathname === "/") return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      return NextResponse.next();
    } else if (role === "KELURAHAN") {
      if (pathname === "/") return NextResponse.redirect(new URL("/kelurahan/dashboard", request.url));
      return NextResponse.next();
    } else if (role === "PETUGAS") {
      if (pathname === "/" || pathname === "/dashboard") return NextResponse.redirect(new URL("/petugas/dashboard", request.url));
      return NextResponse.next();
    } else {
      return NextResponse.next();
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
