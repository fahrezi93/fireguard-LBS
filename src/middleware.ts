import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME } from "@/lib/session";
import { verifyAuthToken } from "@/lib/api-security";

// Rute autentikasi (jika sudah login, user dialihkan ke dashboard masing-masing)
const authPaths = ["/login", "/register", "/operator/login", "/onboarding", "/reset-password"];

// Prefix rute terproteksi (hanya rute-rute ini yang WAJIB login)
const protectedPrefixes = [
  "/admin",
  "/operator",
  "/kelurahan",
  "/petugas",
  "/dashboard",
  "/report",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  // 1. Izinkan akses ke API, file Next.js internals, static files, dan file berekstensi
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") // File dengan extension (.js, .css, .png, dll)
  ) {
    return NextResponse.next();
  }

  const isAuthPath = authPaths.includes(pathname);
  const isProtectedPath =
    protectedPrefixes.some((prefix) => pathname.startsWith(prefix)) && !isAuthPath;

  // 2. Jika user sudah login, jangan izinkan kembali ke halaman auth
  if (isAuthPath && token) {
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

  // 3. Jika rute BUKAN rute terproteksi (misal halaman publik atau halaman yang tidak ada / 404),
  // biarkan Next.js memprosesnya secara normal sehingga not-found.tsx dapat muncul.
  if (!isProtectedPath) {
    return NextResponse.next();
  }

  // 4. Jika rute TERPROTEKSI dan tidak ada token, redirect ke login yang sesuai
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.startsWith("/operator")
      ? "/operator/login"
      : "/login";
    return NextResponse.redirect(url);
  }

  // 5. Jika rute TERPROTEKSI dan ada token, verifikasi dan periksa otorisasi role
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

    // Jika role khusus mencoba mengakses rute dashboard pengguna biasa (/dashboard)
    if (isOperator) {
      return NextResponse.redirect(new URL("/operator/dashboard", request.url));
    } else if (pathname.startsWith("/dashboard")) {
      if (role === "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      } else if (role === "KELURAHAN") {
        return NextResponse.redirect(new URL("/kelurahan/dashboard", request.url));
      } else if (role === "PETUGAS") {
        return NextResponse.redirect(new URL("/petugas/dashboard", request.url));
      }
    }

    return NextResponse.next();
  } catch (err) {
    // Jika token tidak valid pada rute terproteksi, hapus cookie dan redirect ke login
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
