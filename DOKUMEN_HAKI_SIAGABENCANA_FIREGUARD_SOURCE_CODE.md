# LAMPIRAN CONTOH CIPTAAN PROGRAM KOMPUTER
## UNTUK PENDAFTARAN HAK CIPTA (HAKI) - DJKI KEMENKUMHAM RI

**Judul Ciptaan:** FIREGUARD / SIAGABENCANA: SISTEM INFORMASI TANGGAP DARURAT PELAPORAN DAN PENANGANAN KEBAKARAN BERBASIS LOCATION-BASED SERVICES (LBS)
**Jenis Ciptaan:** Program Komputer / Aplikasi Web & Mobile Response
**Teknologi:** TypeScript, Next.js, React 19, Leaflet GIS, MySQL, Firebase, Node.js
**Total Baris Kode:** ± 5.430 Baris Kode Program Inti (Core Logic)

---

## DAFTAR ISI BERKAS SOURCE CODE

### BAGIAN I: ARSITEKTUR KEAMANAN, DATABASE & GEOLOKASI (LBS CORE ENGINE)
- **Modul 1:** `src/middleware.ts` — *Middleware Keamanan & Otentikasi Rute (Route Guard)*
- **Modul 2:** `src/lib/api-security.ts` — *Modul Proteksi API & Role-Based Access Control (RBAC)*
- **Modul 3:** `src/lib/geo.ts` — *Modul Geospasial & Algoritma Jarak Terdekat (LBS Haversine)*
- **Modul 4:** `src/lib/db.ts` — *Modul Koneksi Database & Manajemen Transaksi Data*

### BAGIAN II: BACKEND API PELAPORAN, DISPATCH & TRACKING PETUGAS
- **Modul 5:** `src/app/api/reports/route.ts` — *API Endpoint Pembuatan Laporan Darurat Kebakaran*
- **Modul 6:** `src/app/api/operator/reports/[reportId]/route.ts` — *API Manajemen & Verifikasi Status Laporan Kebakaran*
- **Modul 7:** `src/app/api/operator/dispatch/route.ts` — *API Penugasan & Dispatch Armada Pemadam ke Titik Insiden*
- **Modul 8:** `src/app/api/operator/broadcast/route.ts` — *API Pengiriman Peringatan Dini & Broadcast Wilayah Darurat*
- **Modul 9:** `src/app/api/petugas/accept/route.ts` — *API Penerimaan Penugasan Darurat oleh Petugas Damkar*
- **Modul 10:** `src/app/api/petugas/request-backup/route.ts` — *API Permintaan Bantuan Tambahan Armada Damkar (Backup Request)*
- **Modul 11:** `src/app/api/petugas/update-location/route.ts` — *API Pelacak Koordinat GPS Real-Time Armada Petugas*
- **Modul 12:** `src/app/api/petugas/update-status/route.ts` — *API Pembaruan Status Penanganan Lapangan*

### BAGIAN III: MULTI-CHANNEL BROADCAST & NOTIFIKASI DARURAT
- **Modul 13:** `src/services/notification-service.ts` — *Service Notifikasi Multi-Platform (FCM, Email, WhatsApp)*
- **Modul 14:** `src/lib/whatsapp.ts` — *Modul Integrasi WhatsApp Gateway untuk Peringatan Dini*

### BAGIAN IV: KOMPONEN PETA GEOSPASIAL & COMMAND CENTER OPERATOR
- **Modul 15:** `src/components/AdminMap.tsx` — *Komponen Peta Pemantauan Posko & Sebaran Insiden (GIS Admin)*
- **Modul 16:** `src/components/HotspotMap.tsx` — *Komponen Visualisasi Sebaran Titik Panas (Hotspot Map)*
- **Modul 17:** `src/components/LiveTrackingMap.tsx` — *Komponen Pemantauan Pergerakan Real-Time Armada Damkar*
- **Modul 18:** `src/components/RoutingMachine.tsx` — *Komponen Penentuan Rute Evakuasi & Jalur Tercepat (Emergency Routing)*
- **Modul 19:** `src/components/ReportDetailModal.tsx` — *Komponen Antarmuka Pusat Komando & Verifikasi Insiden (Command Center)*

### BAGIAN V: ANTARMUKA PELAPORAN MASYARAKAT (CITIZEN INTERFACE)
- **Modul 20:** `src/app/report/new/page.tsx` — *Antarmuka Formulir Pelaporan Darurat Berbasis GPS Otomatis*
- **Modul 21:** `src/app/lapor-cepat/page.tsx` — *Antarmuka Tombol Darurat / Lapor Cepat Sekali Sentuh (Quick Panic Button)*

---

# BAGIAN I: ARSITEKTUR KEAMANAN, DATABASE & GEOLOKASI (LBS CORE ENGINE)

## Modul 1: Middleware Keamanan & Otentikasi Rute (Route Guard)
- **Path File:** `src/middleware.ts`
- **Jumlah Baris:** 129 baris
- **Fungsi:** Menangani pengamanan rute HTTP, verifikasi token JWT session, proteksi akses operator/admin, dan filtering permintaan ilegal.

```typescript
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
      const role = payload.role as string | undefined;

      if (isOperator) {
        return NextResponse.redirect(new URL("/operator/dashboard", request.url));
      } else if (role === "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      } else if (role === "KELURAHAN") {
        return NextResponse.redirect(new URL("/kelurahan/dashboard", request.url));
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
    const role = payload.role as string | undefined;

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

    // Jika mencoba mengakses rute pengguna biasa
    if (isOperator) {
      return NextResponse.redirect(new URL("/operator/dashboard", request.url));
    } else if (role === "SUPER_ADMIN") {
      if (pathname === "/") return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      return NextResponse.next();
    } else if (role === "KELURAHAN") {
      if (pathname === "/") return NextResponse.redirect(new URL("/kelurahan/dashboard", request.url));
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

```

---

## Modul 2: Modul Proteksi API & Role-Based Access Control (RBAC)
- **Path File:** `src/lib/api-security.ts`
- **Jumlah Baris:** 124 baris
- **Fungsi:** Fungsi otentikasi API backend, ekstraksi credential JWT, validasi role pengguna (Warga, Operator, Petugas Lapangan, Admin).

```typescript
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
  role?: string;
  kelurahan_id?: number | null;
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

  if (auth.payload.isOperator !== true && auth.payload.role !== "SUPER_ADMIN") {
    return { response: forbidden("Akses khusus operator atau admin.") };
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

```

---

## Modul 3: Modul Geospasial & Algoritma Jarak Terdekat (LBS Haversine)
- **Path File:** `src/lib/geo.ts`
- **Jumlah Baris:** 89 baris
- **Fungsi:** Algoritma komputasi geospasial untuk menghitung jarak akurat titik koordinat GPS insiden terhadap posko pemadam kebakaran terdekat.

```typescript
import { fireStations, FireStation } from './fire-stations';

// Asumsi kecepatan rata-rata mobil damkar di dalam kota (dalam km/jam)
const AVERAGE_SPEED_KMH = 40;

/**
 * Menghitung jarak Haversine (garis lurus di permukaan bumi) antara dua titik GPS.
 * @returns Jarak dalam kilometer.
 */
function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius Bumi dalam km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Jarak dalam km
}

export interface ETAResult {
  nearestStation: FireStation;
  distanceKm: number;
  etaMinutes: number;
}

/**
 * Mendapatkan alamat dari koordinat menggunakan Nominatim (OpenStreetMap).
 * @param lat Latitude
 * @param lon Longitude
 * @returns String alamat lengkap atau pesan error.
 */
export async function getAddressFromCoordinates(lat: number, lon: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      {
        headers: {
          'User-Agent': 'SiagaBencanaApp/1.0 (https://github.com/your-repo)' // Aturan penggunaan Nominatim
        }
      }
    );
    if (!response.ok) {
      throw new Error(`Nominatim API failed with status ${response.status}`);
    }
    const data = await response.json();
    if (data && data.display_name) {
      return data.display_name;
    }
    return "Alamat detail tidak ditemukan.";
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return "Tidak dapat mengambil data alamat saat ini.";
  }
}

/**
 * Menghitung pos damkar terdekat dan estimasi waktu tiba (ETA).
 * @param reportLat Latitude dari lokasi kejadian.
 * @param reportLon Longitude dari lokasi kejadian.
 * @returns Objek yang berisi data pos terdekat, jarak, dan ETA.
 */
export function calculateETA(reportLat: number, reportLon: number): ETAResult {
  let nearestStation: FireStation | null = null;
  let minDistance = Infinity;

  // Cari pos damkar dengan jarak terpendek
  for (const station of fireStations) {
    const distance = getHaversineDistance(reportLat, reportLon, station.latitude, station.longitude);
    if (distance < minDistance) {
      minDistance = distance;
      nearestStation = station;
    }
  }

  if (!nearestStation) {
    throw new Error("Tidak ada data pos damkar.");
  }

  const timeInHours = minDistance / AVERAGE_SPEED_KMH;
  const timeInMinutes = Math.round(timeInHours * 60);

  return {
    nearestStation: nearestStation,
    distanceKm: parseFloat(minDistance.toFixed(2)),
    etaMinutes: timeInMinutes,
  };
}

```

---

## Modul 4: Modul Koneksi Database & Manajemen Transaksi Data
- **Path File:** `src/lib/db.ts`
- **Jumlah Baris:** 92 baris
- **Fungsi:** Pengelolaan connection pool database MySQL, sanitasi query, dan eksekusi transaksi basis data pelaporan dan penugasan.

```typescript
import mysql from 'mysql2/promise';

// ── Pool MySQL — dioptimasi untuk VPS DigitalOcean (persistent server) ──
// Node.js timezone diset via TZ=Asia/Jakarta di .env, sehingga 'local'
// secara otomatis merujuk ke WIB tanpa perlu manual offset.
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'siagabencana',
  waitForConnections: true,
  connectionLimit: 10,  // Lebih tinggi untuk VPS persistent (bukan serverless)
  queueLimit: 30,
  timezone: 'local',    // Mengikuti TZ=Asia/Jakarta dari .env → otomatis WIB
  dateStrings: false,
  // ── Mencegah ECONNRESET / ETIMEDOUT ──
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 8000,
  idleTimeout: 60000,   // VPS bisa keep idle lebih lama dari serverless
  maxIdle: 5,
});

// ── Error codes yang menandakan koneksi lama sudah mati ──
const STALE_CONNECTION_CODES = new Set([
  'ECONNRESET',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'PROTOCOL_CONNECTION_LOST',
  'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR',
]);

/**
 * Eksekusi query dengan satu kali retry otomatis jika koneksi stale.
 * Ini mengatasi kasus di mana MySQL men-drop koneksi idle (wait_timeout).
 */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    const code: string = err?.code ?? '';
    if (STALE_CONNECTION_CODES.has(code)) {
      // Koneksi lama mati — coba sekali lagi dengan koneksi fresh dari pool
      console.warn(`[db] Koneksi stale terdeteksi (${code}), mencoba ulang...`);
      return await fn();
    }
    throw err;
  }
}

// Fungsi untuk mengeksekusi query SELECT yang mengembalikan banyak baris
export async function queryRows<T>(sql: string, args?: any[]): Promise<T[]> {
  const [rows] = await withRetry(() => pool.execute(sql, args || []));
  return rows as T[];
}

// Fungsi untuk mengeksekusi query SELECT yang mengembalikan satu baris
export async function queryRow<T>(sql: string, args?: any[]): Promise<T | null> {
  const [rows] = await withRetry(() => pool.execute(sql, args || []));
  const result = rows as T[];
  return result[0] || null;
}

// Fungsi untuk mengeksekusi query INSERT, UPDATE, DELETE
export async function execute(sql: string, args?: any[]): Promise<number> {
  const [result] = await withRetry(() => pool.execute(sql, args || []));
  return (result as mysql.ResultSetHeader).affectedRows;
}

// Fungsi untuk mengeksekusi query INSERT dan mendapatkan ID baris terakhir
export async function executeAndGetLastInsertId(sql: string, args?: any[]): Promise<number> {
  const [result] = await withRetry(() => pool.execute(sql, args || []));
  return (result as mysql.ResultSetHeader).insertId;
}

// Export pool untuk akses langsung jika diperlukan
export { pool };

// Helper function untuk format Date ke format MySQL datetime (WIB)
// Menggunakan getHours/getMinutes/etc. (local time) yang secara otomatis
// mengacu ke WIB karena TZ=Asia/Jakarta sudah diset di environment VPS.
export function formatDateForMySQL(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}


```

---

# BAGIAN II: BACKEND API PELAPORAN, DISPATCH & TRACKING PETUGAS

## Modul 5: API Endpoint Pembuatan Laporan Darurat Kebakaran
- **Path File:** `src/app/api/reports/route.ts`
- **Jumlah Baris:** 302 baris
- **Fungsi:** Menerima laporan darurat dari warga, geotagging koordinat GPS, validasi data insiden, upload bukti gambar, dan integrasi pemicu notifikasi.

```typescript
import { NextRequest } from "next/server";
import { executeAndGetLastInsertId, formatDateForMySQL, queryRow } from "@/lib/db";
import { getAuthPayloadFromRequest, handleCorsOptions, jsonWithCors } from "@/lib/cors";
import { enforceRateLimit } from "@/lib/rate-limit";

// Upload gambar ke Cloudinary menggunakan unsigned upload preset
async function uploadToCloudinary(buffer: Buffer, filename: string): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary belum dikonfigurasi. Tambahkan CLOUDINARY_CLOUD_NAME dan CLOUDINARY_UPLOAD_PRESET ke environment variables.');
  }

  // Gunakan FormData bawaan Next.js/Browser
  const formData = new FormData();

  // Konversi buffer ke Blob agar FormData di Next.js/Node 18+ mengirimnya dengan benar sebagai multipart/form-data
  // Gunakan Uint8Array dari buffer untuk kompatibilitas tipe data Blob
  const blob = new Blob([new Uint8Array(buffer)]);

  formData.append('file', blob, filename);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'siagabencana/reports');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[Cloudinary] Error Response (${response.status}):`, errText);
    throw new Error(`Cloudinary upload gagal: ${response.status} ${errText}`);
  }

  const data = await response.json();
  return data.secure_url as string;
}

// OPTIONS: CORS preflight
export async function OPTIONS() {
  return handleCorsOptions();
}

async function getAuthPayload(request: NextRequest) {
  return getAuthPayloadFromRequest(request);
}

export async function POST(request: NextRequest) {
  try {
    const limit = enforceRateLimit(request, "reports-submit", 20, 60_000);
    if (!limit.allowed) {
      return jsonWithCors(
        { message: "Terlalu banyak laporan dalam waktu singkat. Coba lagi sebentar." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) }, request }
      );
    }

    const user = await getAuthPayload(request);

    // Verify user exists in database
    const dbUser = await queryRow("SELECT id, name, email FROM users WHERE id = ?", [user.id]) as { id: number, name: string, email: string } | undefined;

    if (!dbUser) {
      return jsonWithCors(
        { message: "User tidak ditemukan. Silakan login ulang." },
        { status: 401 }
      );
    }

    const userId = user.id;

    const formData = await request.formData();
    // Flutter sends snake_case field names
    const fireLatitude = (formData.get("fire_latitude") ?? formData.get("fireLatitude")) as string;
    const fireLongitude = (formData.get("fire_longitude") ?? formData.get("fireLongitude")) as string;
    const reporterLatitude = (formData.get("reporter_latitude") ?? formData.get("reporterLatitude")) as string | null;
    const reporterLongitude = (formData.get("reporter_longitude") ?? formData.get("reporterLongitude")) as string | null;
    const description = formData.get("description") as string | null;
    const address = formData.get("address") as string | null;
    const mediaFile = formData.get("media") as File | null;
    const notes = formData.get("notes") as string | null;
    const contact = formData.get("contact") as string | null;
    const categoryId = (formData.get("category_id") ?? formData.get("categoryId")) as string | null;
    const kelurahanId = (formData.get("kelurahan_id") ?? formData.get("kelurahanId")) as string | null;

    const fireLatNumber = Number(fireLatitude);
    const fireLngNumber = Number(fireLongitude);
    const reporterLatNumber = reporterLatitude ? Number(reporterLatitude) : null;
    const reporterLngNumber = reporterLongitude ? Number(reporterLongitude) : null;
    const parsedCategoryId = categoryId ? Number(categoryId) : 1;
    const parsedKelurahanId = kelurahanId ? Number(kelurahanId) : null;

    if (!fireLatitude || !fireLongitude) {
      return jsonWithCors(
        { message: "Data laporan tidak lengkap (lokasi kejadian wajib)." },
        { status: 400 }
      );
    }

    if (
      Number.isNaN(fireLatNumber) ||
      Number.isNaN(fireLngNumber) ||
      fireLatNumber < -90 ||
      fireLatNumber > 90 ||
      fireLngNumber < -180 ||
      fireLngNumber > 180
    ) {
      return jsonWithCors({ message: "Koordinat lokasi kejadian tidak valid." }, { status: 400, request });
    }

    if (
      reporterLatNumber !== null &&
      (Number.isNaN(reporterLatNumber) || reporterLatNumber < -90 || reporterLatNumber > 90)
    ) {
      return jsonWithCors({ message: "Koordinat pelapor (latitude) tidak valid." }, { status: 400, request });
    }

    if (
      reporterLngNumber !== null &&
      (Number.isNaN(reporterLngNumber) || reporterLngNumber < -180 || reporterLngNumber > 180)
    ) {
      return jsonWithCors({ message: "Koordinat pelapor (longitude) tidak valid." }, { status: 400, request });
    }

    if (!Number.isInteger(parsedCategoryId) || parsedCategoryId <= 0) {
      return jsonWithCors({ message: "Kategori tidak valid." }, { status: 400, request });
    }

    if (parsedKelurahanId !== null && (!Number.isInteger(parsedKelurahanId) || parsedKelurahanId <= 0)) {
      return jsonWithCors({ message: "Kelurahan tidak valid." }, { status: 400, request });
    }

    // Upload dan kompresi file jika ada (opsional) — menggunakan Cloudinary
    let mediaUrl: string | null = null;
    if (mediaFile && mediaFile.size > 0) {
      const originalBuffer = Buffer.from(await mediaFile.arrayBuffer());
      const isImage = mediaFile.type.startsWith('image/');

      let finalBuffer: Buffer = originalBuffer;
      let extension = mediaFile.name.split('.').pop() || 'jpg';

      // Kompresi hanya untuk gambar sebelum upload ke Cloudinary
      if (isImage) {
        try {
          const sharp = (await import('sharp')).default;
          finalBuffer = await sharp(originalBuffer)
            .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();
          extension = 'jpg';
          console.log(`[Media] Compressed: ${originalBuffer.length} -> ${finalBuffer.length} bytes`);
        } catch (compressError) {
          console.error('[Media] Compression failed, using original:', compressError);
          finalBuffer = originalBuffer;
        }
      }

      const filename = `${Date.now()}-report.${extension}`;
      // Upload ke Cloudinary (external storage — berfungsi di VPS maupun environment lain)
      mediaUrl = await uploadToCloudinary(finalBuffer, filename);
      console.log(`[Media] Uploaded to Cloudinary: ${mediaUrl}`);
    }

    const currentTimestamp = formatDateForMySQL(new Date());

    // Insert report dengan category_id dan kelurahan_id
    let reportId: number;
    try {
      reportId = await executeAndGetLastInsertId(
        "INSERT INTO reports (user_id, fire_latitude, fire_longitude, reporter_latitude, reporter_longitude, description, address, media_url, notes, contact, category_id, kelurahan_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          userId,
          fireLatNumber,
          fireLngNumber,
          reporterLatNumber,
          reporterLngNumber,
          description,
          address,
          mediaUrl,
          notes,
          contact,
          parsedCategoryId,
          parsedKelurahanId,
          'pending',
          currentTimestamp
        ]
      );
    } catch (dbError: any) {
      // Fallback: insert without category_id if column doesn't exist
      if (dbError.message?.includes('category_id') || dbError.message?.includes('no column')) {
        reportId = await executeAndGetLastInsertId(
          "INSERT INTO reports (user_id, fire_latitude, fire_longitude, reporter_latitude, reporter_longitude, description, address, media_url, notes, contact, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            userId,
            fireLatNumber,
            fireLngNumber,
            reporterLatNumber,
            reporterLngNumber,
            description,
            address,
            mediaUrl,
            notes,
            contact,
            'pending',
            currentTimestamp
          ]
        );
      } else {
        throw dbError;
      }
    }

    // Kirim response segera setelah insert berhasil
    const responsePayload = jsonWithCors(
      { message: "Laporan berhasil dikirim!", reportId },
      { status: 201 }
    );

    // Kirim Email Resi Laporan secara asinkron
    if (dbUser.email) {
      void import('@/lib/email').then(({ sendStatusUpdateEmail }) => {
        sendStatusUpdateEmail(
          dbUser.email,
          dbUser.name,
          reportId,
          'submitted',
          'Terima kasih, laporan Anda telah kami terima dan akan segera diverifikasi oleh tim.'
        );
      }).catch(err => console.error('[Email Resi] Gagal kirim email resi:', err));
    }

    // WebSocket broadcast ke operator — jalankan async tanpa blokir response
    const wss = global.wss;
    if (wss) {
      void (async () => {
        try {
          const { queryRow: qr } = await import('@/lib/db');
          const fullReport = await qr(
            `SELECT r.id, r.user_id, r.guest_name, r.fire_latitude, r.fire_longitude, r.reporter_latitude, r.reporter_longitude,
                    r.status, r.created_at, r.media_url, r.description, r.address, r.notes, r.contact,
                    r.assigned_petugas_id, r.dispatched_at, r.accepted_at, r.arrived_at, r.completed_at, r.status_petugas, r.completion_photo_url, r.response_time_seconds, r.needs_backup, r.petugas_notes,
                    u.name as user_name, u.phone_number,
                    c.id as category_id, c.name as category_name, c.icon as category_icon, c.color as category_color,
                    k.id as kelurahan_id, k.name as kelurahan_name, k.kecamatan, k.kota
             FROM reports r
             JOIN users u ON r.user_id = u.id
             LEFT JOIN disaster_categories c ON r.category_id = c.id
             LEFT JOIN kelurahan k ON r.kelurahan_id = k.id
             WHERE r.id = ?`,
            [reportId]
          );
          wss.broadcast(
            JSON.stringify({
              type: "NEW_REPORT",
              payload: fullReport ?? {
                id: reportId,
                fire_latitude: fireLatNumber,
                fire_longitude: fireLngNumber,
                reporter_latitude: reporterLatNumber,
                reporter_longitude: reporterLngNumber,
                media_url: mediaUrl,
                status: "pending",
                created_at: currentTimestamp,
                phone_number: user.phone,
              },
            })
          );
        } catch (wsErr) {
          console.error('[WebSocket] Gagal broadcast laporan baru:', wsErr);
        }
      })();
    }

    return responsePayload;
  } catch (error: any) {
    console.error('[POST /api/reports] Error:', error?.message ?? error);

    if (error.message?.includes("autentikasi")) {
      return jsonWithCors({ message: "Akses ditolak." }, { status: 401 });
    }

    if (error.message?.includes("Cloudinary")) {
      return jsonWithCors(
        { message: "Gagal mengupload foto. Coba lagi atau kirim tanpa foto." },
        { status: 502 }
      );
    }

    return jsonWithCors(
      {
        message: "Terjadi kesalahan pada server.",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

```

---

## Modul 6: API Manajemen & Verifikasi Status Laporan Kebakaran
- **Path File:** `src/app/api/operator/reports/[reportId]/route.ts`
- **Jumlah Baris:** 434 baris
- **Fungsi:** Endpoint bagi operator untuk memverifikasi kevalidan laporan (Valid/Hoax), mengubah status darurat, dan koordinasi aksi.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { queryRow, execute } from "@/lib/db";
import { getAddressFromCoordinates } from "@/lib/geo";
import { sendStatusUpdateEmail } from "@/lib/email";
import { requireOperator } from "@/lib/api-security";
import { sendWhatsAppReportUpdate } from "@/lib/whatsapp";

// Helper: title notifikasi per status (konsisten dengan notification-service.ts & reports/[id]/route.ts)
function _getNotifTitle(status: string): string {
  const titles: Record<string, string> = {
    approved: 'Laporan Disetujui',
    in_progress: 'Laporan Sedang Ditangani',
    completed: 'Laporan Selesai',
    verified: 'Laporan Terverifikasi',
    false_report: 'Laporan Ditolak',
  };
  return titles[status] ?? 'Pembaruan Laporan';
}

// Helper: body notifikasi per status (konsisten dengan notification-service.ts & reports/[id]/route.ts)
function _getNotifBody(status: string): string {
  const bodies: Record<string, string> = {
    approved: 'Laporan Anda telah disetujui dan sedang diproses',
    in_progress: 'Petugas sedang menangani laporan Anda',
    completed: 'Laporan Anda telah diselesaikan',
    verified: 'Laporan Anda telah diverifikasi oleh petugas',
    false_report: 'Laporan Anda ditandai sebagai laporan palsu',
  };
  return bodies[status] ?? 'Status laporan Anda telah diperbarui';
}

// --- Konfigurasi Fonnte (Opsional) ---
const ENABLE_WHATSAPP = process.env.ENABLE_WHATSAPP === "true";
const ALLOWED_REPORT_STATUS = new Set([
  "pending",
  "submitted",
  "approved",
  "verified",
  "in_progress",
  "diproses",
  "dispatched",
  "dikirim",
  "arrived",
  "ditangani",
  "completed",
  "selesai",
  "false_report",
  "dibatalkan",
  "false",
  "escalated_to_damkar",
]);

const NOTIFICATION_STATUS_MAP: Record<string, string> = {
  approved: 'approved',
  in_progress: 'in_progress',
  completed: 'completed',
  verified: 'verified',
  false_report: 'false_report',
  diproses: 'in_progress',
  ditangani: 'in_progress',
  dispatched: 'in_progress',
  dikirim: 'in_progress',
  arrived: 'in_progress',
  selesai: 'completed',
  false: 'false_report',
};

function normalizeNotificationStatus(status: string): string {
  const normalized = status.trim().toLowerCase();
  return NOTIFICATION_STATUS_MAP[normalized] || normalized;
}


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const auth = await requireOperator(request);
    if ("response" in auth) return auth.response;

    const { reportId } = await params;
    const parsedReportId = Number(reportId);
    if (!Number.isInteger(parsedReportId) || parsedReportId <= 0) {
      return NextResponse.json({ message: "ID laporan tidak valid." }, { status: 400 });
    }
    const report = await queryRow(
      `SELECT 
              r.id, r.user_id, r.fire_latitude, r.fire_longitude, r.reporter_latitude, r.reporter_longitude,
              r.status, r.created_at, r.media_url, r.notes, r.contact, r.description, r.address,
              r.guest_name, r.admin_notes,
              r.assigned_petugas_id, r.dispatched_at, r.accepted_at, r.arrived_at, r.completed_at, 
              r.status_petugas, r.completion_photo_url, r.response_time_seconds, r.needs_backup, r.petugas_notes,
              u.name as user_name, u.email as user_email, u.phone_number,
              c.id as category_id, c.name as category_name, c.icon as category_icon, c.color as category_color,
              k.id as kelurahan_id, k.name as kelurahan_name, k.kecamatan, k.kota
       FROM reports r 
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN disaster_categories c ON r.category_id = c.id
       LEFT JOIN kelurahan k ON r.kelurahan_id = k.id
       WHERE r.id = ?`,
      [parsedReportId]
    );
    if (!report) {
      return NextResponse.json(
        { message: "Laporan tidak ditemukan." },
        { status: 404 }
      );
    }

    // Bentuk ulang response agar konsisten dengan format list (nested category & kelurahan)
    const r = report as any;
    const formatted = {
      ...r,
      category: r.category_id ? {
        id: r.category_id,
        name: r.category_name,
        icon: r.category_icon,
        color: r.category_color,
      } : null,
      kelurahan: r.kelurahan_id ? {
        id: r.kelurahan_id,
        name: r.kelurahan_name,
        kecamatan: r.kecamatan,
        kota: r.kota,
      } : null,
    };

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const auth = await requireOperator(request);
    if ("response" in auth) return auth.response;

    const { reportId } = await params;
    const parsedReportId = Number(reportId);
    if (!Number.isInteger(parsedReportId) || parsedReportId <= 0) {
      return NextResponse.json({ message: "ID laporan tidak valid." }, { status: 400 });
    }
    const { status: newStatus, adminNotes, kelurahanId, categoryId, needsBackup } = await request.json();
    const parsedKelurahanId = kelurahanId === undefined ? undefined : Number(kelurahanId);
    const parsedCategoryId = categoryId === undefined ? undefined : Number(categoryId);
    const parsedNeedsBackup = needsBackup === undefined ? undefined : Boolean(needsBackup);

    if (newStatus !== undefined && !ALLOWED_REPORT_STATUS.has(String(newStatus))) {
      return NextResponse.json({ message: "Status laporan tidak valid." }, { status: 400 });
    }

    // Ambil status saat ini untuk menghindari double update & double notif
    const currentReport = await queryRow<{ status: string }>(
      'SELECT status FROM reports WHERE id = ?',
      [parsedReportId]
    );

    if (!currentReport) {
      return NextResponse.json({ message: `Laporan dengan ID ${reportId} tidak ditemukan.` }, { status: 404 });
    }

    // Mencegah double click / duplicate status update
    if (newStatus && currentReport.status === newStatus) {
       return NextResponse.json({ message: `Laporan sudah berstatus ${newStatus}.` }, { status: 200 });
    }

    if (adminNotes !== undefined && (typeof adminNotes !== "string" || adminNotes.length > 1000)) {
      return NextResponse.json({ message: "Catatan petugas tidak valid." }, { status: 400 });
    }

    if (
      parsedKelurahanId !== undefined &&
      (!Number.isInteger(parsedKelurahanId) || parsedKelurahanId <= 0)
    ) {
      return NextResponse.json({ message: "Kelurahan tidak valid." }, { status: 400 });
    }

    if (
      parsedCategoryId !== undefined &&
      (!Number.isInteger(parsedCategoryId) || parsedCategoryId <= 0)
    ) {
      return NextResponse.json({ message: "Kategori tidak valid." }, { status: 400 });
    }

    // Build dynamic SQL update
    const updates: string[] = [];
    const args: any[] = [];

    if (newStatus) {
      updates.push('status = ?');
      args.push(newStatus);

      // Sinkronisasi status_petugas jika laporan diakhiri oleh operator (selesai/palsu)
      // agar tugas tidak nyangkut di aplikasi mobile petugas piket
      if (['completed', 'selesai', 'false_report', 'false', 'dibatalkan'].includes(newStatus)) {
        updates.push('status_petugas = ?');
        args.push(newStatus === 'selesai' ? 'completed' : newStatus === 'false' ? 'false_report' : newStatus);
      }
    }

    if (adminNotes !== undefined) {
      updates.push('admin_notes = ?');
      args.push(adminNotes);
    }

    if (kelurahanId !== undefined) {
      updates.push('kelurahan_id = ?');
      args.push(parsedKelurahanId);
    }

    if (categoryId !== undefined) {
      updates.push('category_id = ?');
      args.push(parsedCategoryId);
    }

    if (needsBackup !== undefined) {
      updates.push('needs_backup = ?');
      args.push(parsedNeedsBackup ? 1 : 0);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { message: "Tidak ada data yang diubah." },
        { status: 400 }
      );
    }

    const sql = `UPDATE reports SET ${updates.join(', ')} WHERE id = ?`;
    args.push(parsedReportId);

    const rowsAffected = await execute(sql, args);

    if (rowsAffected === 0) {
      return NextResponse.json(
        { message: `Laporan dengan ID ${reportId} tidak ditemukan.` },
        { status: 404 }
      );
    }

    // Ambil data report dan user untuk notifikasi
    const report = await queryRow<{
      user_id: number | null;
      fire_latitude: number;
      fire_longitude: number;
      contact: string | null;
    }>(
      'SELECT user_id, fire_latitude, fire_longitude, contact FROM reports WHERE id = ?',
      [parsedReportId]
    );

    if (report && newStatus) {
      const canonicalStatus = normalizeNotificationStatus(String(newStatus));

      const user = report.user_id ? await queryRow<{ name: string; email: string; phone_number: string }>(
        'SELECT name, email, phone_number FROM users WHERE id = ?',
        [report.user_id]
      ) : null;

      // Status labels untuk notifikasi (tanpa emoji)
      const statusLabels: Record<string, string> = {
        pending: 'Menunggu Verifikasi',
        submitted: 'Baru Dikirim',
        approved: 'Laporan Disetujui',
        verified: 'Terverifikasi',
        in_progress: 'Sedang Ditangani',
        diproses: 'Sedang Diproses',
        dispatched: 'Unit Dikirim',
        dikirim: 'Tim Dikirim',
        arrived: 'Unit Tiba',
        ditangani: 'Sedang Ditangani',
        completed: 'Selesai',
        selesai: 'Selesai',
        dibatalkan: 'Dibatalkan',
        false_report: 'Laporan Palsu',
        false: 'Laporan Palsu',
        escalated_to_damkar: 'Butuh Damkar',
      };

      const statusLabel = statusLabels[canonicalStatus] || statusLabels[newStatus] || newStatus;

      // BARU: Simpan notifikasi ke database untuk web (hanya jika ada user_id)
      if (report.user_id) {
        let dbNotificationId: number | undefined;
        try {
          const { executeAndGetLastInsertId, formatDateForMySQL } = await import('@/lib/db');
          const currentTimestamp = formatDateForMySQL(new Date());

          const notifTitle = _getNotifTitle(canonicalStatus);
          let notifMessage = _getNotifBody(canonicalStatus);
          if (adminNotes) {
            notifMessage += `\n\nCatatan petugas: ${adminNotes}`;
          }

          dbNotificationId = await executeAndGetLastInsertId(
            `INSERT INTO notifications (user_id, title, message, type, report_id, is_read, created_at) 
             VALUES (?, ?, ?, ?, ?, FALSE, ?)`,
            [report.user_id, notifTitle, notifMessage, 'status_update', parsedReportId, currentTimestamp]
          );
        } catch (notifError) {
          console.error('Error creating notification:', notifError);
        }

        // Trigger push notification asynchronously (hybrid mode: push + inbox table)
        void import('@/services/notification-service')
          .then(({ sendReportStatusNotification }) =>
            sendReportStatusNotification(parsedReportId, report.user_id as number, canonicalStatus, dbNotificationId)
          )
          .catch((pushError) => {
            console.error('Error triggering push notification:', pushError);
          });
      }

      // Logika Pengiriman Email (Untuk Selesai & Laporan Palsu sebagai arsip)
      if (user && user.email && (canonicalStatus === 'completed' || canonicalStatus === 'false_report')) {
        sendStatusUpdateEmail(
          user.email,
          user.name,
          parsedReportId,
          canonicalStatus,
          adminNotes
        );
      }

      // Logika Pengiriman WhatsApp (Untuk Urgensi: Unit Berangkat & Laporan Palsu)
      if (ENABLE_WHATSAPP && (canonicalStatus === 'in_progress' || canonicalStatus === 'false_report')) {
        const address = await getAddressFromCoordinates(report.fire_latitude, report.fire_longitude);
        
        if (user && user.phone_number) {
          sendWhatsAppReportUpdate(
            user.phone_number,
            user.name,
            parsedReportId,
            statusLabel,
            address,
            adminNotes
          );
        } else if (!report.user_id && report.contact) {
          sendWhatsAppReportUpdate(
            report.contact,
            "Pelapor",
            parsedReportId,
            statusLabel,
            address,
            adminNotes
          );
        }
      }
    }

    // Broadcast status update via WebSocket
    const wss = global.wss;
    if (wss) {
      wss.broadcast(
        JSON.stringify({
          type: "STATUS_UPDATE",
          payload: { 
            reportId: parsedReportId, 
            newStatus: newStatus || undefined,
            needsBackup: parsedNeedsBackup
          },
        })
      );
    }

    return NextResponse.json({
      message: `Data laporan #${reportId} berhasil diperbarui.`,
    });
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const auth = await requireOperator(request);
    if ("response" in auth) return auth.response;

    const { reportId } = await params;
    const parsedReportId = Number(reportId);
    if (!Number.isInteger(parsedReportId) || parsedReportId <= 0) {
      return NextResponse.json({ message: "ID laporan tidak valid." }, { status: 400 });
    }

    // Cek laporan ada
    const existing = await queryRow(
      "SELECT id, media_url FROM reports WHERE id = ?",
      [parsedReportId]
    ) as any;

    if (!existing) {
      return NextResponse.json({ message: "Laporan tidak ditemukan." }, { status: 404 });
    }

    // Hapus notifikasi terkait laporan ini
    await execute("DELETE FROM notifications WHERE report_id = ?", [parsedReportId]);

    // Hapus laporan
    await execute("DELETE FROM reports WHERE id = ?", [parsedReportId]);

    // Broadcast ke operator via WebSocket agar list terupdate
    const wss = global.wss;
    if (wss) {
      wss.broadcast(
        JSON.stringify({ type: "REPORT_DELETED", payload: { reportId: parsedReportId } })
      );
    }

    return NextResponse.json({
      success: true,
      message: `Laporan #${parsedReportId} berhasil dihapus.`,
    });
  } catch (error) {
    console.error("Error deleting report:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan pada server." },
      { status: 500 }
    );
  }
}

```

---

## Modul 7: API Penugasan & Dispatch Armada Pemadam ke Titik Insiden
- **Path File:** `src/app/api/operator/dispatch/route.ts`
- **Jumlah Baris:** 131 baris
- **Fungsi:** Mekanisme penugasan regu pemadam terdekat, alokasi armada damkar, dan pengiriman sinyal tugas ke aplikasi petugas.

```typescript
import { NextRequest } from "next/server";
import { queryRow, execute, queryRows } from "@/lib/db";
import { getAuthPayloadFromRequest, handleCorsOptions, jsonWithCors } from "@/lib/cors";
import { getMessaging } from "@/lib/firebase-admin";

export async function OPTIONS() {
  return handleCorsOptions();
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthPayloadFromRequest(request);

    // Pastikan user adalah operator atau super admin
    if (!user.isOperator && user.role !== 'operator' && user.role !== 'SUPER_ADMIN') {
      return jsonWithCors({ message: "Akses ditolak. Anda bukan operator atau admin." }, { status: 403, request });
    }

    const { reportId } = await request.json();

    if (!reportId) {
      return jsonWithCors({ message: "ID Laporan (reportId) wajib diisi." }, { status: 400, request });
    }

    // Ambil detail laporan dan pastikan kelurahan_id ada
    const report = await queryRow<{ id: number, kelurahan_id: number, status: string, assigned_petugas_id: number, category_name: string }>(
      "SELECT r.id, r.kelurahan_id, r.status, r.assigned_petugas_id, c.name as category_name FROM reports r LEFT JOIN disaster_categories c ON r.category_id = c.id WHERE r.id = ?",
      [reportId]
    );

    if (!report) {
      return jsonWithCors({ message: "Laporan tidak ditemukan." }, { status: 404, request });
    }

    if (report.status === 'completed' || report.status === 'false_report') {
      return jsonWithCors({ message: "Laporan sudah selesai, tidak perlu di-dispatch." }, { status: 400, request });
    }

    if (report.status === 'dispatched' || report.status === 'dikirim' || report.status === 'ditangani' || report.status === 'in_progress') {
      return jsonWithCors({ message: "Laporan ini sudah di-dispatch atau sedang ditangani." }, { status: 400, request });
    }

    if (report.assigned_petugas_id) {
      return jsonWithCors({ message: "Laporan sudah diambil oleh petugas." }, { status: 400, request });
    }

    if (!report.kelurahan_id) {
      return jsonWithCors({ message: "Laporan belum memiliki wilayah kelurahan (kelurahan_id kosong)." }, { status: 400, request });
    }

    // Cari semua petugas yang sedang piket tanpa mempedulikan kelurahannya
    const petugasList = await queryRows<{ id: number, name: string }>(
      "SELECT id, name FROM users WHERE role = 'petugas' AND is_on_duty = 1"
    );

    if (petugasList.length === 0) {
      return jsonWithCors({ 
        message: "Tidak ada petugas yang sedang piket (On Duty) saat ini.", 
        petugas_count: 0 
      }, { status: 404, request });
    }

    const petugasIds = petugasList.map(p => p.id);

    // Update laporan menjadi 'dispatched' dan catat waktunya
    await execute(
      "UPDATE reports SET dispatched_at = NOW(), status_petugas = 'pending' WHERE id = ?",
      [reportId]
    );

    // Ambil token FCM petugas
    const tokens = await queryRows<{ device_token: string }>(
      `SELECT device_token FROM device_tokens WHERE user_id IN (${petugasIds.map(() => '?').join(',')}) AND is_active = TRUE`,
      petugasIds
    );

    const messaging = getMessaging();
    let sentCount = 0;

    if (messaging && tokens.length > 0) {
      // Kirim Broadcast FCM ke semua petugas
      const tokenStrings = tokens.map(t => t.device_token);
      
      const payload = {
        notification: {
          title: `🚨 DARURAT: ${report.category_name || 'Bencana'} Baru!`,
          body: "Buka aplikasi sekarang untuk mengambil tugas ini!",
        },
        data: {
          type: "dispatch",
          target: "mobile",
          reportId: String(reportId),
        },
        android: {
          priority: "high" as const,
          notification: {
            sound: "emergency_siren",
            channelId: "siagabencana_emergency",
          },
        },
      };

      try {
        const response = await messaging.sendEachForMulticast({
          tokens: tokenStrings,
          ...payload
        });
        sentCount = response.successCount;
      } catch (fcmErr) {
        console.error("Gagal mengirim FCM dispatch:", fcmErr);
      }
    }

    return jsonWithCors({
      success: true,
      message: `Tugas berhasil di-broadcast ke ${petugasList.length} petugas.`,
      dispatched_to: petugasList.length,
      fcm_sent: sentCount
    }, { status: 200, request });

  } catch (error: any) {
    if (error.message?.includes("autentikasi") || error.message?.includes("Token")) {
      return jsonWithCors({ message: "Akses ditolak." }, { status: 401, request });
    }
    console.error("Dispatch Error:", error);
    return jsonWithCors({
      success: false,
      message: "Terjadi kesalahan internal.",
    }, { status: 500, request });
  }
}

```

---

## Modul 8: API Pengiriman Peringatan Dini & Broadcast Wilayah Darurat
- **Path File:** `src/app/api/operator/broadcast/route.ts`
- **Jumlah Baris:** 193 baris
- **Fungsi:** Endpoint bagi operator untuk menyebarkan informasi darurat bencana kebakaran ke seluruh warga di radius terdampak.

```typescript
/**
 * POST /api/operator/broadcast
 *
 * Endpoint untuk operator mengirim notifikasi broadcast ke SEMUA pengguna.
 * Mirip cara kerja info-notif Tokopedia / Gojek.
 *
 * Flow:
 *   1. Validasi sesi operator via cookie (pakai requireOperator)
 *   2. Validasi input: title & message wajib ada
 *   3. Simpan record ke tabel `notifications` untuk semua user
 *   4. Ambil semua device_token aktif dari tabel `device_tokens`
 *   5. Kirim FCM multicast via Firebase Admin (sendEachForMulticast, max 500/batch)
 *   6. Log hasil ke `broadcast_logs`
 *   7. Return summary
 *
 * GET /api/operator/broadcast — riwayat broadcast yang pernah dikirim
 */

import { NextRequest } from 'next/server';
import { queryRows, execute, formatDateForMySQL } from '@/lib/db';
import { requireOperator } from '@/lib/api-security';
import { jsonWithCors, handleCorsOptions } from '@/lib/cors';
import { getMessaging } from '@/lib/firebase-admin';

export async function OPTIONS() {
    return handleCorsOptions();
}

export async function POST(request: NextRequest) {
    try {
        const auth = await requireOperator(request);
        if ('response' in auth) return auth.response;
        const operatorId = auth.payload.id;
        
        // 2. Validasi input
        const body = await request.json();
        const title: string = (body.title ?? '').trim();
        const message: string = (body.message ?? '').trim();

        if (!title || !message) {
            return jsonWithCors({ message: 'Judul dan isi pesan wajib diisi.' }, { status: 400 });
        }
        if (title.length > 200) {
            return jsonWithCors({ message: 'Judul terlalu panjang (maks 200 karakter).' }, { status: 400 });
        }
        if (message.length > 1000) {
            return jsonWithCors({ message: 'Pesan terlalu panjang (maks 1000 karakter).' }, { status: 400 });
        }

        const now = formatDateForMySQL(new Date());

        // 4. Ambil semua user_id yang terdaftar
        const users = await queryRows<{ id: number }>('SELECT id FROM users');

        // 5. Simpan notifikasi ke tabel `notifications` untuk semua user sekaligus
        // Simpan ID per user agar bisa disertakan di FCM payload untuk dedup di mobile
        const userNotifIds = new Map<number, number>(); // userId → notificationId
        if (users.length > 0) {
            for (const user of users) {
                try {
                    const { executeAndGetLastInsertId } = await import('@/lib/db');
                    const notifId = await executeAndGetLastInsertId(
                        `INSERT INTO notifications (user_id, title, message, type, created_at) VALUES (?, ?, ?, ?, ?)`,
                        [user.id, title, message, 'broadcast', now]
                    );
                    userNotifIds.set(user.id, notifId);
                } catch (insertErr) {
                    console.error(`[Broadcast] Gagal insert notif untuk user ${user.id}:`, insertErr);
                }
            }
        }

        // 6. Ambil semua device token aktif (Android & iOS) beserta user_id-nya
        const tokenRows = await queryRows<{ device_token: string; user_id: number }>(
            `SELECT device_token, user_id
             FROM device_tokens
             WHERE is_active = TRUE
               AND platform IN ('android', 'ios')`
        );

        let successCount = 0;
        let failureCount = 0;
        const firebase = getMessaging();

        if (firebase && tokenRows.length > 0) {
            // Kirim per-token agar bisa sertakan notificationId yang tepat per user
            const BATCH_SIZE = 500;
            // Group token by notificationId untuk efisiensi
            const tokensByNotifId = new Map<string, string[]>();
            for (const row of tokenRows) {
                const notifId = userNotifIds.get(row.user_id)?.toString() ?? '';
                if (!tokensByNotifId.has(notifId)) tokensByNotifId.set(notifId, []);
                tokensByNotifId.get(notifId)!.push(row.device_token);
            }

            for (const [notifId, tokens] of tokensByNotifId) {
                for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
                    const batch = tokens.slice(i, i + BATCH_SIZE);
                    try {
                        const batchResponse = await firebase.sendEachForMulticast({
                            tokens: batch,
                            notification: { title, body: message },
                            data: {
                                type: 'broadcast',
                                target: 'mobile',
                                ...(notifId ? { notificationId: notifId } : {}),
                                sentAt: now,
                            },
                            android: {
                                priority: 'high',
                                notification: {
                                    channelId: 'siagabencana_reports',
                                    priority: 'high',
                                    sound: 'default',
                                    defaultSound: true,
                                    defaultVibrateTimings: true,
                                },
                            },
                            apns: {
                                payload: { aps: { sound: 'default', badge: 1 } },
                            },
                        });
                        successCount += batchResponse.successCount;
                        failureCount += batchResponse.failureCount;
                    } catch (err) {
                        console.error('[Broadcast] FCM batch error:', err);
                        failureCount += batch.length;
                    }
                }
            }
        }

        const allTokens = tokenRows.map(r => r.device_token);

        // 7. Log hasil ke tabel broadcast_logs
        try {
            await execute(
                `INSERT INTO broadcast_logs
                 (operator_id, title, message, total_tokens, success_count, failure_count, sent_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [operatorId, title, message, allTokens.length, successCount, failureCount, now]
            );
        } catch (logErr) {
            console.warn('[Broadcast] Gagal menyimpan log broadcast:', logErr);
        }

        return jsonWithCors({
            success: true,
            message: 'Broadcast berhasil dikirim!',
            summary: {
                total_users: users.length,
                total_tokens: allTokens.length,
                success: successCount,
                failure: failureCount,
                firebase_ready: firebase !== null,
            },
        });
    } catch (error: any) {
        console.error('[Broadcast] POST error:', error);
        return jsonWithCors(
            { message: 'Terjadi kesalahan saat mengirim broadcast.' },
            { status: 500 }
        );
    }
}

/** GET /api/operator/broadcast — riwayat broadcast */
export async function GET(request: NextRequest) {
    try {
        const auth = await requireOperator(request);
        if ('response' in auth) return auth.response;

        const logs = await queryRows<{
            id: number;
            title: string;
            message: string;
            total_tokens: number;
            success_count: number;
            failure_count: number;
            sent_at: string;
        }>(
            `SELECT id, title, message, total_tokens, success_count, failure_count, sent_at
             FROM broadcast_logs
             ORDER BY sent_at DESC
             LIMIT 30`
        );

        return jsonWithCors({ success: true, data: logs });
    } catch (error: any) {
        console.error('[Broadcast] GET error:', error);
        return jsonWithCors({ message: 'Gagal mengambil riwayat broadcast.' }, { status: 500 });
    }
}

```

---

## Modul 9: API Penerimaan Penugasan Darurat oleh Petugas Damkar
- **Path File:** `src/app/api/petugas/accept/route.ts`
- **Jumlah Baris:** 90 baris
- **Fungsi:** Menerima konfirmasi kesiapan petugas dalam menerima tugas penanganan kebakaran dari posko komando.

```typescript
import { NextRequest } from "next/server";
import { queryRow, execute, pool } from "@/lib/db";
import { getAuthPayloadFromRequest, handleCorsOptions, jsonWithCors } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthPayloadFromRequest(request);

    // Pastikan ini adalah petugas
    if (user.role?.toUpperCase() !== 'PETUGAS') {
      return jsonWithCors({ message: "Hanya petugas yang bisa menerima tugas ini." }, { status: 403, request });
    }

    const { reportId } = await request.json();

    if (!reportId) {
      return jsonWithCors({ message: "ID Laporan (reportId) wajib diisi." }, { status: 400, request });
    }

    // Gunakan koneksi dari pool secara langsung agar bisa menggunakan transaksi
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Lock baris laporan spesifik dengan FOR UPDATE untuk mencegah Race Condition (Rebutan)
      const [rows]: any = await connection.execute(
        "SELECT id, assigned_petugas_id, status_petugas FROM reports WHERE id = ? FOR UPDATE",
        [reportId]
      );

      if (rows.length === 0) {
        await connection.rollback();
        return jsonWithCors({ message: "Laporan tidak ditemukan." }, { status: 404, request });
      }

      const report = rows[0];

      // Cek jika sudah diambil orang lain
      if (report.assigned_petugas_id !== null) {
        await connection.rollback();
        return jsonWithCors({ message: "Maaf, tugas ini sudah diambil oleh petugas lain." }, { status: 400, request });
      }

      // Tandai diambil dan ubah status utama ke in_progress agar operator tahu
      await connection.execute(
        "UPDATE reports SET assigned_petugas_id = ?, status = 'in_progress', status_petugas = 'accepted', accepted_at = NOW() WHERE id = ?",
        [user.id, reportId]
      );

      await connection.commit();

      // Broadcast WebSocket
      const wss = (global as any).wss;
      if (wss) {
        wss.broadcast(
          JSON.stringify({
            type: "STATUS_UPDATE",
            payload: { reportId: Number(reportId), newStatus: 'in_progress' },
          })
        );
      }

      return jsonWithCors({
        success: true,
        message: "Berhasil mengambil tugas! Segera menuju lokasi."
      }, { status: 200, request });

    } catch (transactionError) {
      await connection.rollback();
      throw transactionError;
    } finally {
      connection.release();
    }

  } catch (error: any) {
    if (error.message?.includes("autentikasi") || error.message?.includes("Token")) {
      return jsonWithCors({ message: "Akses ditolak." }, { status: 401, request });
    }
    console.error("Accept Error:", error);
    return jsonWithCors({
      success: false,
      message: "Terjadi kesalahan internal.",
    }, { status: 500, request });
  }
}

```

---

## Modul 10: API Permintaan Bantuan Tambahan Armada Damkar (Backup Request)
- **Path File:** `src/app/api/petugas/request-backup/route.ts`
- **Jumlah Baris:** 56 baris
- **Fungsi:** Mekanisme permintaan bantuan armada dan personil damkar tambahan saat eskalasi kebakaran membesar di lapangan.

```typescript
import { NextRequest } from "next/server";
import { queryRow, execute } from "@/lib/db";
import { getAuthPayloadFromRequest, handleCorsOptions, jsonWithCors } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthPayloadFromRequest(request);

    if (user.role?.toUpperCase() !== 'PETUGAS') {
      return jsonWithCors({ message: "Hanya petugas yang bisa meminta bantuan armada." }, { status: 403, request });
    }

    const { reportId } = await request.json();

    if (!reportId) {
      return jsonWithCors({ message: "ID laporan tidak valid." }, { status: 400, request });
    }

    // Check if report exists and is assigned to this petugas
    const report: any = await queryRow(`SELECT id, status FROM reports WHERE id = ? AND assigned_petugas_id = ?`, [reportId, user.id]);

    if (!report) {
      return jsonWithCors({ message: "Laporan tidak ditemukan atau Anda tidak ditugaskan ke laporan ini." }, { status: 404, request });
    }

    if (['completed', 'false_report', 'selesai', 'dibatalkan'].includes(report.status)) {
      return jsonWithCors({ message: "Tidak dapat meminta bantuan untuk tugas yang sudah selesai." }, { status: 400, request });
    }

    const adminNoteAppend = "\n[URGENT] Petugas meminta bantuan armada tambahan (SOS)!";

    await execute(
      `UPDATE reports SET needs_backup = 1, admin_notes = CONCAT(IFNULL(admin_notes, ''), ?) WHERE id = ?`,
      [adminNoteAppend, reportId]
    );

    const wss = (global as any).wss;
    if (wss) {
      wss.broadcast(
        JSON.stringify({
          type: "BACKUP_REQUEST",
          payload: { reportId, petugasName: user.name }
        })
      );
    }

    return jsonWithCors({ success: true, message: "Permintaan bantuan berhasil dikirim ke markas." }, { status: 200, request });
  } catch (error: any) {
    console.error('Request backup error:', error);
    return jsonWithCors({ message: "Terjadi kesalahan internal server.", error: error.message }, { status: 500, request });
  }
}

```

---

## Modul 11: API Pelacak Koordinat GPS Real-Time Armada Petugas
- **Path File:** `src/app/api/petugas/update-location/route.ts`
- **Jumlah Baris:** 48 baris
- **Fungsi:** Menerima pembaruan koordinat GPS langsung dari perangkat petugas damkar saat menuju lokasi kebakaran.

```typescript
import { NextRequest } from "next/server";
import { execute } from "@/lib/db";
import { getAuthPayloadFromRequest, handleCorsOptions, jsonWithCors } from "@/lib/cors";

export async function OPTIONS() {
  return handleCorsOptions();
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthPayloadFromRequest(request);

    if (user.role?.toUpperCase() !== 'PETUGAS') {
      return jsonWithCors({ message: "Akses ditolak. Anda bukan petugas." }, { status: 403, request });
    }

    const { lat, lng } = await request.json();

    if (lat === undefined || lng === undefined) {
      return jsonWithCors({ message: "Latitude dan Longitude wajib diisi." }, { status: 400, request });
    }

    await execute(
      "UPDATE users SET last_latitude = ?, last_longitude = ?, last_location_update = NOW() WHERE id = ?",
      [lat, lng, user.id]
    );

    // Broadcast location update via WebSocket
    const wss = global.wss;
    if (wss) {
      wss.broadcast(
        JSON.stringify({
          type: "PETUGAS_LOCATION_UPDATE",
          payload: { petugasId: user.id, lat, lng },
        })
      );
    }

    return jsonWithCors({ success: true, message: "Lokasi berhasil diperbarui." }, { status: 200, request });

  } catch (error: any) {
    if (error.message?.includes("autentikasi") || error.message?.includes("Token")) {
      return jsonWithCors({ message: "Akses ditolak. Silakan login kembali." }, { status: 401, request });
    }
    console.error("Update Location Error:", error);
    return jsonWithCors({ message: "Terjadi kesalahan server internal." }, { status: 500, request });
  }
}

```

---

## Modul 12: API Pembaruan Status Penanganan Lapangan
- **Path File:** `src/app/api/petugas/update-status/route.ts`
- **Jumlah Baris:** 246 baris
- **Fungsi:** Mencatat perubahan status penanganan insiden: Menuju Lokasi (On The Way), Tiba di TKP, Proses Pemadaman, hingga Pemadaman Selesai.

```typescript
import { NextRequest } from "next/server";
import { queryRow, queryRows, execute } from "@/lib/db";
import { getAuthPayloadFromRequest, handleCorsOptions, jsonWithCors } from "@/lib/cors";
import { getMessaging } from "@/lib/firebase-admin";
import { getAddressFromCoordinates } from "@/lib/geo";
import { sendStatusUpdateEmail } from "@/lib/email";
import { sendWhatsAppReportUpdate } from "@/lib/whatsapp";
import { executeAndGetLastInsertId, formatDateForMySQL } from "@/lib/db";

export async function OPTIONS(request: NextRequest) {
  return handleCorsOptions(request);
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthPayloadFromRequest(request);

    if (user.role?.toUpperCase() !== 'PETUGAS') {
      return jsonWithCors({ message: "Hanya petugas yang bisa update status." }, { status: 403, request });
    }

    let reportId: string | null = null;
    let status: string | null = null;
    let photoUrl: string | null = null;
    let notes: string | null = null;

    // Cek apakah request berupa multipart/form-data atau JSON
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      reportId = formData.get('reportId') as string;
      status = formData.get('status') as string;
      notes = formData.get('notes') as string | null;

      const file = formData.get('file') as File | null;
      if (file && file.size > 0) {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

        if (cloudName && uploadPreset) {
          const buffer = await file.arrayBuffer();
          const uploadFormData = new FormData();
          const blob = new Blob([new Uint8Array(buffer)]);
          uploadFormData.append('file', blob, file.name);
          uploadFormData.append('upload_preset', uploadPreset);
          uploadFormData.append('folder', 'siagabencana/completion_photos');

          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            { method: 'POST', body: uploadFormData }
          );

          if (response.ok) {
            const data = await response.json();
            photoUrl = data.secure_url;
          } else {
            console.error("Gagal upload ke Cloudinary:", await response.text());
          }
        }
      }
    } else {
      const body = await request.json();
      reportId = body.reportId;
      status = body.status;
      photoUrl = body.photoUrl;
      notes = body.notes;
    }

    if (!reportId || !status) {
      return jsonWithCors({ message: "ID Laporan dan status wajib diisi." }, { status: 400, request });
    }

    const validStatuses = ['arrived', 'completed', 'false_report', 'escalated_to_damkar'];
    if (!validStatuses.includes(status)) {
      return jsonWithCors({ message: "Status tidak valid." }, { status: 400, request });
    }

    if (status === 'completed' && !photoUrl) {
      return jsonWithCors({ message: "Foto bukti penyelesaian wajib dilampirkan." }, { status: 400, request });
    }

    // Ambil laporan beserta data user (pelapor)
    const report = await queryRow<any>(
      `SELECT r.id, r.assigned_petugas_id, r.dispatched_at, r.user_id, r.fire_latitude, r.fire_longitude,
              u.name as user_name, u.email as user_email, u.phone_number as user_phone
       FROM reports r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [reportId]
    );

    if (!report) {
      return jsonWithCors({ message: "Laporan tidak ditemukan." }, { status: 404, request });
    }

    if (report.assigned_petugas_id !== user.id) {
      return jsonWithCors({ message: "Anda tidak ditugaskan untuk laporan ini." }, { status: 403, request });
    }

    let query = "UPDATE reports SET status_petugas = ?";
    const params: any[] = [status];

    if (status === 'arrived') {
      query += ", arrived_at = NOW(), status = 'arrived'";
    } else if (['completed', 'false_report', 'escalated_to_damkar'].includes(status)) {
      query += ", completed_at = NOW()";

      // Calculate response time in query: TIMESTAMPDIFF(SECOND, dispatched_at, NOW())
      if (report.dispatched_at) {
        query += ", response_time_seconds = TIMESTAMPDIFF(SECOND, dispatched_at, NOW())";
      }

      if (notes) {
        query += ", petugas_notes = ?";
        params.push(notes);
      }

      if (status === 'completed') {
        query += ", completion_photo_url = ?";
        params.push(photoUrl);
        query += ", status = 'completed'";
      } else if (status === 'false_report') {
        query += ", status = 'false_report'";
      } else if (status === 'escalated_to_damkar') {
        query += ", status = 'escalated_to_damkar'";
      }
    }

    query += " WHERE id = ?";
    params.push(reportId);

    await execute(query, params);

    // Kirim notifikasi ke pelapor jika laporan selesai atau palsu
    if (status === 'completed' || status === 'false_report') {
      try {
        const canonicalStatus = status === 'completed' ? 'completed' : 'false_report';

        // Title dan message standar untuk notifikasi
        const notifTitle = canonicalStatus === 'completed' ? 'Laporan Selesai' : 'Laporan Ditolak';
        let notifMessage = canonicalStatus === 'completed'
          ? 'Laporan Anda telah diselesaikan'
          : 'Laporan Anda ditandai sebagai laporan palsu';

        if (notes) {
          notifMessage += `\n\nCatatan petugas: ${notes}`;
        }

        // 1 & 2: Push Notif & DB Notif (hanya jika user terdaftar)
        if (report.user_id) {
          const currentTimestamp = formatDateForMySQL(new Date());
          let dbNotificationId: number | undefined;
          try {
            dbNotificationId = await executeAndGetLastInsertId(
              `INSERT INTO notifications (user_id, title, message, type, report_id, is_read, created_at) 
               VALUES (?, ?, ?, ?, ?, FALSE, ?)`,
              [report.user_id, notifTitle, notifMessage, 'status_update', reportId, currentTimestamp]
            );
          } catch (notifDbErr) {
            console.error('Error creating notification in DB:', notifDbErr);
          }

          // 2. Trigger FCM (hybrid mode)
          void import('@/services/notification-service')
            .then(({ sendReportStatusNotification }) =>
              sendReportStatusNotification(Number(reportId), report.user_id, canonicalStatus, dbNotificationId)
            )
            .catch((pushError) => {
              console.error('Error triggering push notification:', pushError);
            });
        }

        // 3. Logika Pengiriman Email (Selesai & Palsu)
        if (report.user_email) {
          sendStatusUpdateEmail(
            report.user_email,
            report.user_name,
            Number(reportId),
            canonicalStatus,
            notes || undefined
          );
        }

        // 4. Logika Pengiriman WhatsApp (Hanya untuk Laporan Palsu)
        const ENABLE_WHATSAPP = process.env.ENABLE_WHATSAPP === "true";
        if (ENABLE_WHATSAPP && canonicalStatus === 'false_report') {
          const address = await getAddressFromCoordinates(report.fire_latitude, report.fire_longitude);
          const statusLabel = 'Laporan Palsu';

          if (report.user_phone) {
            sendWhatsAppReportUpdate(
              report.user_phone,
              report.user_name,
              Number(reportId),
              statusLabel,
              address,
              notes || undefined
            );
          } else if (!report.user_id) {
            // Fetch contact directly from db if it wasn't fetched in the previous query
            const guestReport = await queryRow<any>("SELECT contact FROM reports WHERE id = ?", [reportId]);
            if (guestReport && guestReport.contact) {
              sendWhatsAppReportUpdate(
                guestReport.contact,
                "Pelapor",
                Number(reportId),
                statusLabel,
                address,
                notes || undefined
              );
            }
          }
        }
      } catch (notifErr) {
        console.error("Gagal memproses notifikasi:", notifErr);
      }
    }

    // Broadcast status update via WebSocket agar Dashboard Web terupdate
    const wss = global.wss;
    if (wss) {
      wss.broadcast(
        JSON.stringify({
          type: "STATUS_UPDATE",
          payload: { reportId: Number(reportId), newStatus: status === 'false_report' ? 'false_report' : status },
        })
      );
    }

    return jsonWithCors({
      success: true,
      message: `Status berhasil diubah menjadi ${status}.`
    }, { status: 200, request });

  } catch (error: any) {
    if (error.message?.includes("autentikasi") || error.message?.includes("Token")) {
      return jsonWithCors({ message: "Akses ditolak." }, { status: 401, request });
    }
    console.error("Update Status Error:", error);
    return jsonWithCors({
      success: false,
      message: "Terjadi kesalahan internal.",
    }, { status: 500, request });
  }
}

```

---

# BAGIAN III: MULTI-CHANNEL BROADCAST & NOTIFIKASI DARURAT

## Modul 13: Service Notifikasi Multi-Platform (FCM, Email, WhatsApp)
- **Path File:** `src/services/notification-service.ts`
- **Jumlah Baris:** 448 baris
- **Fungsi:** Pusat orkestrasi pengiriman notifikasi darurat secara instan ke ponsel petugas (Push Notification Firebase) dan warga sekitar.

```typescript
/**
 * Notification Service
 *
 * Provides notification content generation for report status changes.
 * Implements Indonesian language notification messages for all status types.
 * Handles FCM notification sending with retry logic and error handling.
 */

import { getMessaging } from "@/lib/firebase-admin";
import { execute, queryRows, formatDateForMySQL } from "@/lib/db";

interface NotificationContent {
  title: string;
  body: string;
}

interface NotificationPayload {
  title: string;
  body: string;
  data: {
    reportId: string;
    status: string;
    type: string;
    target?: string;
    notificationId?: string;
  };
}

interface DeviceToken {
  device_token: string;
  platform: string;
}

interface NotificationPreferences {
  approved: boolean | number;
  in_progress: boolean | number;
  completed: boolean | number;
  verified: boolean | number;
  false_report: boolean | number;
}

const STATUS_CANONICAL_MAP: Record<string, string> = {
  approved: "approved",
  in_progress: "in_progress",
  completed: "completed",
  verified: "verified",
  false_report: "false_report",
  diproses: "in_progress",
  ditangani: "in_progress",
  dispatched: "in_progress",
  dikirim: "in_progress",
  arrived: "in_progress",
  selesai: "completed",
  false: "false_report",
};

const STATUS_TO_PREFERENCE_KEY: Record<string, keyof NotificationPreferences> =
{
  approved: "approved",
  in_progress: "in_progress",
  completed: "completed",
  verified: "verified",
  false_report: "false_report",
};

const MOBILE_PLATFORMS = ["android", "ios"];
const ANDROID_NOTIFICATION_CHANNEL_ID = "siagabencana_reports";

export function normalizeNotificationStatus(status: string): string {
  const normalized = status.trim().toLowerCase();
  return STATUS_CANONICAL_MAP[normalized] || normalized;
}

function isPreferenceEnabled(value: boolean | number | undefined): boolean {
  return value === undefined || value === true || value === 1;
}

/**
 * Get localized notification content for a given report status
 *
 * @param status - The report status (approved, in_progress, completed, verified, false_report)
 * @returns Notification content with title and body in Indonesian
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */
export function getNotificationContent(status: string): NotificationContent {
  switch (status) {
    case "approved":
      return {
        title: "Laporan Disetujui",
        body: "Laporan Anda telah disetujui dan sedang diproses",
      };

    case "in_progress":
      return {
        title: "Laporan Sedang Ditangani",
        body: "Petugas sedang menangani laporan Anda",
      };

    case "completed":
      return {
        title: "Laporan Selesai",
        body: "Laporan Anda telah diselesaikan",
      };

    case "verified":
      return {
        title: "Laporan Terverifikasi",
        body: "Laporan Anda telah diverifikasi oleh petugas",
      };

    case "false_report":
      return {
        title: "Laporan Ditolak",
        body: "Laporan Anda ditandai sebagai laporan palsu",
      };

    default:
      return {
        title: "Pembaruan Laporan",
        body: "Status laporan Anda telah diperbarui",
      };
  }
}

/**
 * Send notification to a single device via FCM
 *
 * @param deviceToken - The FCM device token to send notification to
 * @param payload - The notification payload containing title, body, and data
 * @returns Promise<boolean> - true if notification was sent successfully, false otherwise
 *
 * Requirements: 5.1
 */
export async function sendToDevice(
  deviceToken: string,
  payload: NotificationPayload,
): Promise<boolean> {
  try {
    const message = {
      token: deviceToken,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        ...payload.data,
        title: payload.title,
        body: payload.body,
      },
      android: {
        priority: "high" as const,
        notification: {
          channelId: ANDROID_NOTIFICATION_CHANNEL_ID,
          priority: "high" as const,
          sound: "default",
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
      apns: {
        headers: {
          "apns-priority": "10",
        },
        payload: {
          aps: {
            sound: "default",
            badge: 1,
            contentAvailable: true,
          },
        },
      },
    };

    const messaging = getMessaging();
    if (!messaging) {
      console.warn(
        "Firebase Messaging not initialized. Cannot send notification.",
      );
      return false;
    }
    await messaging.send(message);
    return true;
  } catch (error: any) {
    await handleFCMError(error, deviceToken);
    return false;
  }
}

/**
 * Retry a function with exponential backoff
 *
 * @param fn - The async function to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param baseDelay - Base delay in milliseconds (default: 1000ms)
 * @returns Promise<boolean> - true if function succeeded, false if all retries failed
 *
 * Requirements: 5.1
 */
export async function retryWithBackoff(
  fn: () => Promise<boolean>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<boolean> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await fn();
      if (result) {
        return true;
      }
      // If result is false, treat it as a failure and retry
      lastError = new Error("Function returned false");
    } catch (error) {
      lastError = error as Error;
    }

    // Don't delay after the last attempt
    if (attempt < maxRetries - 1) {
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(
        `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  console.error(`All ${maxRetries} retry attempts failed:`, lastError?.message);
  return false;
}

/**
 * Handle FCM error responses and take appropriate action
 *
 * @param error - The error object from FCM
 * @param deviceToken - The device token that caused the error
 *
 * Requirements: 5.2, 5.3, 10.1
 */
export async function handleFCMError(
  error: any,
  deviceToken: string,
): Promise<void> {
  const errorCode = error?.code || error?.errorInfo?.code || "unknown";
  const errorMessage = error?.message || "Unknown error";

  console.error(
    `FCM error for token ${deviceToken}: ${errorCode} - ${errorMessage}`,
  );

  switch (errorCode) {
    case "messaging/invalid-registration-token":
    case "messaging/registration-token-not-registered":
      // Mark token as inactive in database (Requirement 5.2)
      try {
        await execute(
          "UPDATE device_tokens SET is_active = FALSE, updated_at = NOW() WHERE device_token = ?",
          [deviceToken],
        );
        console.warn(`Marked invalid token as inactive: ${deviceToken}`);
      } catch (dbError) {
        console.error("Failed to mark token as inactive:", dbError);
      }
      break;

    case "messaging/message-rate-exceeded":
      // Rate limit error - will be handled by retry logic (Requirement 5.3)
      console.warn("FCM rate limit exceeded, will retry with backoff");
      throw new Error("Rate limit exceeded");

    case "messaging/server-unavailable":
    case "messaging/internal-error":
      // Server unavailable - will be handled by retry logic (Requirement 5.3)
      console.warn("FCM server unavailable, will retry with backoff");
      throw new Error("FCM server unavailable");

    default:
      // Log unknown errors (Requirement 10.1)
      console.error(`Unhandled FCM error: ${errorCode} - ${errorMessage}`);
      throw error;
  }
}

/**
 * Send report status notification to user
 *
 * Main orchestration method that handles the complete notification flow:
 * 1. Query user's active device tokens
 * 2. Check user's notification preferences
 * 3. Generate notification content
 * 4. Send to each device with retry logic
 * 5. Log all attempts to notification_logs table
 *
 * @param reportId - The ID of the report that changed status
 * @param userId - The ID of the user who owns the report
 * @param newStatus - The new status of the report
 * @param notificationId - Optional. The ID dari row di tabel `notifications` (jika sudah dibuat).
 *   Disertakan di FCM data payload agar mobile bisa pakai ID yang sama untuk
 *   dedup, mark-read, dan delete (sync ke backend).
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 5.4, 6.5
 */
export async function sendReportStatusNotification(
  reportId: number,
  userId: number,
  newStatus: string,
  notificationId?: number,
): Promise<void> {
  try {
    const canonicalStatus = normalizeNotificationStatus(newStatus);

    // Step 1: Query user's active device tokens (Requirement 2.1)
    const deviceTokens = await queryRows<DeviceToken>(
      `SELECT device_token, platform
       FROM device_tokens
       WHERE user_id = ?
         AND is_active = TRUE
         AND platform IN (?, ?)`,
      [userId, ...MOBILE_PLATFORMS],
    );

    if (deviceTokens.length === 0) {
      console.warn(
        `[Notification] No active mobile device tokens for user ${userId}. ` +
        `Make sure the user logged in after the FCM fix was deployed.`,
      );
      return;
    }

    console.info(
      `[Notification] Found ${deviceTokens.length} mobile device token(s) for user ${userId}`,
    );

    // Step 2: Check user's notification preferences (Requirement 6.5)
    // Dibungkus try-catch sendiri agar preferensi yang tidak ada tidak menghentikan notifikasi
    let preferences: NotificationPreferences[] = [];
    try {
      preferences = await queryRows<NotificationPreferences>(
        "SELECT approved, in_progress, completed, verified, false_report FROM notification_preferences WHERE user_id = ?",
        [userId],
      );
    } catch (prefError: any) {
      console.warn(
        `[Notification] Could not read preferences for user ${userId}: ${prefError?.message}. Defaulting to all enabled.`,
      );
    }

    // If no preferences found, default to all enabled
    const userPrefs = preferences[0] || {
      approved: true,
      in_progress: true,
      completed: true,
      verified: true,
      false_report: true,
    };

    // Check if user wants this notification type
    const preferenceKey = STATUS_TO_PREFERENCE_KEY[canonicalStatus];
    if (preferenceKey && !isPreferenceEnabled(userPrefs[preferenceKey])) {
      console.info(
        `User ${userId} has disabled notifications for status: ${canonicalStatus}`,
      );
      return;
    }

    // Step 3: Generate notification content (Requirement 2.6)
    const content = getNotificationContent(canonicalStatus);
    const payload: NotificationPayload = {
      title: content.title,
      body: content.body,
      data: {
        reportId: reportId.toString(),
        status: canonicalStatus,
        type: "report_status_change",
        target: "mobile",
        // Sertakan notificationId agar mobile bisa pakai ID yang sama
        // untuk dedup, mark-read, dan delete sync ke backend.
        ...(notificationId !== undefined ? { notificationId: notificationId.toString() } : {}),
      },
    };

    // Step 4: Send notification to each device token (Requirement 2.1, 5.1)
    const currentTimestamp = new Date();

    for (const token of deviceTokens) {
      let deliveryStatus: "sent" | "failed" | "retry" = "failed";
      let errorMessage: string | null = null;
      let retryCount = 0;

      try {
        // Send with retry logic (Requirement 5.1)
        const success = await retryWithBackoff(
          async () => sendToDevice(token.device_token, payload),
          3,
          1000,
        );

        if (success) {
          deliveryStatus = "sent";
        } else {
          deliveryStatus = "failed";
          errorMessage = "All retry attempts failed";
          retryCount = 3;
        }
      } catch (error: any) {
        deliveryStatus = "failed";
        errorMessage = error?.message || "Unknown error";
        console.error(
          `Failed to send notification to token ${token.device_token}:`,
          error,
        );
      }

      // Step 5: Log notification attempt (Requirement 2.7)
      try {
        await execute(
          `INSERT INTO notification_logs
           (report_id, user_id, device_token, status_change, title, body, delivery_status, error_message, retry_count, sent_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            reportId,
            userId,
            token.device_token,
            canonicalStatus,
            content.title,
            content.body,
            deliveryStatus,
            errorMessage,
            retryCount,
            formatDateForMySQL(currentTimestamp),
          ],
        );
      } catch (logError) {
        // Don't fail the entire operation if logging fails
        console.error("Failed to log notification attempt:", logError);
      }
    }

    console.info(
      `Notification sent for report ${reportId}, status: ${canonicalStatus}, user: ${userId}`,
    );
  } catch (error: any) {
    // Handle errors gracefully without throwing (Requirement 5.4)
    console.error(`Error in sendReportStatusNotification:`, error);
    // Don't throw - we don't want to block the report status update
  }
}

```

---

## Modul 14: Modul Integrasi WhatsApp Gateway untuk Peringatan Dini
- **Path File:** `src/lib/whatsapp.ts`
- **Jumlah Baris:** 139 baris
- **Fungsi:** Integrasi layanan WhatsApp API untuk pengiriman pesan broadcast peringatan bencana dan alert laporan darurat.

```typescript
// Konfigurasi WhatsApp Server Lokal (Baileys)
const WA_SERVER_URL = process.env.WA_SERVER_URL || "http://localhost:3001";
// Konfigurasi Fonnte (Sebagai Fallback)
const FONNTE_TOKEN = process.env.FONNTE_TOKEN || "";
const ENABLE_WHATSAPP = process.env.ENABLE_WHATSAPP === "true";

export interface WhatsAppResult {
  success: boolean;
  message?: string;
  error?: any;
}

/**
 * Fungsi internal untuk mengirim via Fonnte
 */
async function sendViaFonnte(phone: string, message: string): Promise<WhatsAppResult> {
  if (!FONNTE_TOKEN) {
    console.error("❌ Fallback to Fonnte failed: FONNTE_TOKEN is not set.");
    return { success: false, error: "FONNTE_TOKEN is missing" };
  }

  // Format nomor untuk Fonnte: hilangkan 0 di depan, API Fonnte biasa menerima format '08...' atau '62...'
  let targetPhone = phone.replace(/\D/g, "");
  if (targetPhone.startsWith("0")) {
    targetPhone = "62" + targetPhone.substring(1);
  }

  const data = new FormData();
  data.append("target", targetPhone);
  data.append("message", message);
  data.append("countryCode", "62");

  try {
    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: FONNTE_TOKEN },
      body: data,
    });

    const result = await response.json();
    if (result.status) {
      console.log('✅ Fallback: Message sent successfully via Fonnte');
      return { success: true };
    } else {
      console.error('❌ Fonnte Error:', result.reason || result.detail || JSON.stringify(result));
      return { success: false, error: result.reason || "Failed to send WhatsApp message via Fonnte" };
    }
  } catch (error: any) {
    console.error('❌ Error sending WhatsApp via Fonnte:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fungsi dasar untuk mengirim pesan via WhatsApp (Coba Baileys -> Fallback ke Fonnte)
 */
export async function sendWhatsApp(phone: string, message: string): Promise<WhatsAppResult> {
  if (!ENABLE_WHATSAPP) {
    console.warn("⚠️ WhatsApp is disabled.");
    console.log(`📱 To: ${phone}`);
    console.log(`💬 Message: ${message}`);
    return { success: true, message: "WhatsApp Disabled" };
  }

  try {
    // 1. Mencoba mengirim via Local Baileys Server
    const response = await fetch(`${WA_SERVER_URL}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: phone, message: message }),
    });

    const result = await response.json();
    if (result.success) {
      console.log('✅ Message sent successfully via Baileys Local Server');
      return { success: true };
    } else {
      console.warn('⚠️ Baileys Server Failed (Not connected / Error):', result.error);
      console.log('🔄 Switching to Fonnte Fallback...');
      return await sendViaFonnte(phone, message);
    }
  } catch (error: any) {
    // Ini terjadi jika Local Server mati (ECONNREFUSED)
    console.warn(`⚠️ Baileys Server Unreachable (${error.message}). Switching to Fonnte Fallback...`);
    return await sendViaFonnte(phone, message);
  }
}

/**
 * Kirim OTP via WhatsApp dengan template yang diperbarui
 */
export async function sendWhatsAppOTP(phone: string, otp: string, type: 'register' | 'login' | 'reset' = 'login') {
  let action = "";
  let subject = "";

  if (type === 'register') {
    subject = "Pendaftaran";
    action = "menyelesaikan pendaftaran akun SiagaBencana Anda";
  } else if (type === 'login') {
    subject = "Login";
    action = "masuk ke akun SiagaBencana Anda";
  } else if (type === 'reset') {
    subject = "Reset Password";
    action = "mereset kata sandi akun SiagaBencana Anda";
  }

  const message = `*SiagaBencana - ${subject}*\n\nGunakan kode OTP berikut untuk ${action}:\n\n👉 *${otp}*\n\n⚠️ _Berlaku selama 10 menit. Jangan bagikan kode ini kepada siapapun demi keamanan akun Anda._\n\n_Sent via SiagaBencana System_`;

  return sendWhatsApp(phone, message);
}

/**
 * Kirim Update Status Laporan via WhatsApp
 */
export async function sendWhatsAppReportUpdate(
  phone: string,
  userName: string,
  reportId: string | number,
  statusLabel: string,
  address: string,
  adminNotes?: string
) {
  // Template yang lebih profesional dan informatif
  let message = `*SIAGABENCANA - NOTIFIKASI STATUS*\n\n`;
  message += `Halo *${userName}*,\n`;
  message += `Laporan kejadian Anda dengan ID *#${reportId}* telah diperbarui oleh petugas.\n\n`;
  message += `━━━━━━━━━━━━━━━━━━\n`;
  message += `*STATUS BARU:* ${statusLabel.toUpperCase()}\n`;
  message += `*LOKASI:* ${address}\n`;

  if (adminNotes) {
    message += `*CATATAN:* ${adminNotes}\n`;
  }
  message += `━━━━━━━━━━━━━━━━━━\n\n`;
  message += `Terima kasih telah berkontribusi dalam menjaga keamanan lingkungan. Tetap waspada dan utamakan keselamatan!\n\n`;
  message += `_Pesan ini dikirim secara otomatis oleh sistem SiagaBencana_`;

  return sendWhatsApp(phone, message);
}

```

---

# BAGIAN IV: KOMPONEN PETA GEOSPASIAL & COMMAND CENTER OPERATOR

## Modul 15: Komponen Peta Pemantauan Posko & Sebaran Insiden (GIS Admin)
- **Path File:** `src/components/AdminMap.tsx`
- **Jumlah Baris:** 395 baris
- **Fungsi:** Peta interaktif Leaflet untuk memantau sebaran pos damkar, lokasi insiden aktif, radius bahaya, dan posisi regu pemadam.

```tsx
'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { fireStations, FireStation } from '@/lib/fire-stations';
import RoutingMachine from './RoutingMachine';
import { useMemo, useEffect, useState } from 'react';

// Komponen untuk memperbaiki ukuran peta saat container berubah
function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    // Invalidate size setelah mount dengan delay kecil
    const timeoutId = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    // Juga invalidate saat window resize
    const handleResize = () => {
      map.invalidateSize();
    };

    window.addEventListener('resize', handleResize);

    // Invalidate lagi setelah beberapa saat untuk memastikan CSS sudah sepenuhnya applied
    const secondTimeoutId = setTimeout(() => {
      map.invalidateSize();
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(secondTimeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);

  return null;
}

// Definisikan tipe untuk Laporan
interface Report {
  id: number;
  phone_number: string;
  fire_latitude: number;
  fire_longitude: number;
  reporter_latitude?: number;
  reporter_longitude?: number;
  status: string;
  created_at: string;
  media_url: string;
  assigned_petugas_id?: number | null;
  notes?: string;
  contact?: string;
  acknowledged?: boolean;
  category?: {
    id: number;
    name: string;
    icon: string;
  };
  kelurahan?: {
    id: number;
    name: string;
  };
  needs_backup?: number | boolean;
}

// Ikon untuk Pos Damkar
const createFireStationIcon = () => new L.DivIcon({
  html: `<div style="font-size: 24px;">🚒</div>`,
  className: 'leaflet-emoji-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

// Fungsi untuk membuat icon berdasarkan kategori
const createCategoryIcon = (categoryId?: number, categoryIcon?: string, isCompleted?: boolean, needsBackup?: boolean | number) => {
  if (isCompleted) {
    return new L.DivIcon({
      html: `<div style="font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">✅</div>`,
      className: 'leaflet-emoji-icon',
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });
  }

  // Default emoji berdasarkan categoryId
  const categoryEmojis: Record<number, string> = {
    1: '🔥',  // Kebakaran
    2: '🏗️', // Kerusakan Infrastruktur
    3: '🌊',  // Banjir
    4: '🌪️',  // Angin Puting Beliung
    5: '⛰️',   // Tanah Longsor
    6: '⚠️',   // Kecelakaan
    7: '🚨',   // Lainnya
  };

  const emoji = categoryIcon || categoryEmojis[categoryId || 1] || '🔥';

  const backupIndicator = needsBackup 
    ? `<div style="position: absolute; top: -5px; right: -5px; width: 14px; height: 14px; background-color: #ef4444; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px #ef4444; z-index: 10;" class="animate-pulse"></div>` 
    : '';

  return new L.DivIcon({
    html: `<div style="font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); position: relative; display: inline-block;">
             ${backupIndicator}
             ${emoji}
           </div>`,
    className: 'leaflet-emoji-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
};

// Ikon untuk lokasi pelapor
const createReporterLocationIcon = () => new L.DivIcon({
  html: `<div style="font-size: 24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">📍</div>`,
  className: 'leaflet-emoji-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

// Ikon untuk petugas pemadam
const createPetugasIcon = () => new L.DivIcon({
  html: `<div style="font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🚒</div>`,
  className: 'leaflet-emoji-icon',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

interface PetugasLocation {
  id: number;
  name: string;
  last_latitude: number;
  last_longitude: number;
  last_location_update: string;
  is_on_duty: number | boolean;
}

interface AdminMapProps {
  reports: Report[];
  onReportClick: (report: Report) => void;
  selectedReport?: Report | null;
}

// Fungsi untuk menghitung jarak Haversine (jarak garis lurus)
function haversineDistance(coords1: [number, number], coords2: [number, number]): number {
  function toRad(x: number): number {
    return x * Math.PI / 180;
  }

  const R = 6371; // Radius bumi dalam km
  const dLat = toRad(coords2[0] - coords1[0]);
  const dLon = toRad(coords2[1] - coords1[1]);
  const lat1 = toRad(coords1[0]);
  const lat2 = toRad(coords2[0]);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function AdminMap({ reports, onReportClick, selectedReport }: AdminMapProps) {
  const defaultPosition: [number, number] = [-3.0073, 104.8156]; // Plaju, Palembang
  const [petugasLocations, setPetugasLocations] = useState<PetugasLocation[]>([]);

  // Cek apakah ada laporan aktif yang butuh tracking
  const hasActiveTracking = useMemo(() => {
    return reports.some(r => {
      const s = r.status.toLowerCase();
      return ['diproses', 'dikirim', 'dispatched', 'arrived', 'ditangani', 'in_progress'].includes(s);
    });
  }, [reports]);

  // Fetch lokasi petugas sekali saat ada laporan aktif, lalu dengarkan via WebSocket
  useEffect(() => {
    if (!hasActiveTracking) {
      setPetugasLocations([]);
      return;
    }

    const fetchPetugas = async () => {
      try {
        const res = await fetch('/api/operator/petugas-locations');
        if (res.ok) {
          const data = await res.json();
          setPetugasLocations(data);
        }
      } catch (err) {
        console.error("Gagal fetch petugas:", err);
      }
    };

    fetchPetugas();

    // Setup WebSocket
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "PETUGAS_LOCATION_UPDATE" && data.payload) {
                    setPetugasLocations(prev => {
                        const exists = prev.find(p => p.id === data.payload.petugasId);
                        if (exists) {
                            return prev.map(p => p.id === data.payload.petugasId ? {
                                ...p,
                                last_latitude: data.payload.lat,
                                last_longitude: data.payload.lng,
                                last_location_update: new Date().toISOString()
                            } : p);
                        } else {
                            // Fetch ulang jika ada petugas baru yang tiba-tiba broadcast
                            fetchPetugas();
                            return prev;
                        }
                    });
                }
            } catch (e) {
                // Ignore parsing errors
            }
        };

        ws.onclose = () => {
            reconnectTimeout = setTimeout(connect, 5000);
        };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) {
          ws.onclose = null;
          ws.close();
      }
    };
  }, [hasActiveTracking]);

  // Hitung pos damkar terdekat untuk laporan yang dipilih
  const nearestStation: FireStation | null = useMemo(() => {
    if (!selectedReport) return null;

    // Pastikan koordinat adalah number (DB bisa mengembalikan string)
    const fireLat = Number(selectedReport.fire_latitude);
    const fireLng = Number(selectedReport.fire_longitude);
    if (isNaN(fireLat) || isNaN(fireLng)) return null;

    const firePos: [number, number] = [fireLat, fireLng];

    return fireStations.reduce<FireStation | null>((closest, station) => {
      const distance = haversineDistance(firePos, [station.latitude, station.longitude]);
      if (!closest) {
        return station;
      }

      const closestDistance = haversineDistance(firePos, [closest.latitude, closest.longitude]);
      return distance < closestDistance ? station : closest;
    }, null);
  }, [selectedReport]);

  // Tentukan apakah rute harus ditampilkan
  const showRoute = !!(
    selectedReport &&
    nearestStation &&
    selectedReport.status !== 'selesai' &&
    selectedReport.status !== 'completed' &&
    selectedReport.status !== 'false' &&
    selectedReport.status !== 'false_report'
  );

  return (
    <MapContainer center={defaultPosition} zoom={14} style={{ height: '100%', width: '100%', backgroundColor: '#ffffff' }}>
      <MapResizeHandler />
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      {/* Tampilkan semua pos damkar */}
      {fireStations.map(station => (
        <Marker
          key={`station-${station.name}`}
          position={[station.latitude, station.longitude]}
          icon={createFireStationIcon()}
        >
          <Popup>{station.name}</Popup>
        </Marker>
      ))}

      {/* Marker lokasi kejadian untuk semua laporan */}
      {reports.map(report => {
        const fireLat = Number(report.fire_latitude);
        const fireLng = Number(report.fire_longitude);
        if (isNaN(fireLat) || isNaN(fireLng)) return null;

        const isCompleted = report.status === 'Selesai' || report.status === 'completed' || report.status === 'selesai';
        const categoryIcon = createCategoryIcon(report.category?.id, report.category?.icon, isCompleted, report.needs_backup);
        const categoryName = report.category?.name || 'Kebakaran';

        return (
          <Marker
            key={`fire-${report.id}`}
            position={[fireLat, fireLng]}
            icon={categoryIcon}
            eventHandlers={{ click: () => onReportClick(report) }}
          >
            <Popup>
              <strong>{isCompleted ? `${categoryName} - Selesai` : `Lokasi ${categoryName}`}</strong><br />
              Laporan #{report.id}<br />
              Status: {report.status}
              {report.kelurahan && <><br />Kelurahan: {report.kelurahan.name}</>}
            </Popup>
          </Marker>
        );
      })}

      {/* Marker lokasi pelapor untuk laporan yang punya koordinat pelapor */}
      {reports.flatMap(report => {
        if (!report.reporter_latitude || !report.reporter_longitude) return [];

        const repLat = Number(report.reporter_latitude);
        const repLng = Number(report.reporter_longitude);
        if (isNaN(repLat) || isNaN(repLng)) return [];

        return [(
          <Marker
            key={`reporter-${report.id}`}
            position={[repLat, repLng]}
            icon={createReporterLocationIcon()}
            eventHandlers={{ click: () => onReportClick(report) }}
          >
            <Popup>
              <strong>Lokasi Pelapor</strong><br />
              Laporan #{report.id}
            </Popup>
          </Marker>
        )];
      })}

      {/* Marker lokasi petugas */}
      {petugasLocations.map(petugas => (
        <Marker
          key={`petugas-${petugas.id}`}
          position={[Number(petugas.last_latitude), Number(petugas.last_longitude)]}
          icon={createPetugasIcon()}
        >
          <Popup>
            <strong>{petugas.name}</strong><br />
            {petugas.is_on_duty ? <span style={{ color: 'green' }}>🟢 Bertugas</span> : <span style={{ color: 'orange' }}>🟡 Standby</span>}<br />
            <span style={{ fontSize: '10px', color: '#666' }}>Update: {new Date(petugas.last_location_update).toLocaleTimeString('id-ID')}</span>
          </Popup>
        </Marker>
      ))}

      {/* Rute dari petugas (jika sudah di-assign) atau pos damkar terdekat ke lokasi kebakaran */}
      {showRoute && selectedReport && (() => {
        let routeStart: [number, number] | null = null;
        let routeKey = '';

        if (selectedReport.assigned_petugas_id) {
          const petugas = petugasLocations.find(p => p.id === selectedReport.assigned_petugas_id);
          if (petugas) {
            routeStart = [Number(petugas.last_latitude), Number(petugas.last_longitude)];
            routeKey = `route-petugas-${petugas.id}-${selectedReport.id}`;
          }
        }

        if (!routeStart && nearestStation) {
           routeStart = [nearestStation.latitude, nearestStation.longitude];
           routeKey = `route-station-${nearestStation.name}-${selectedReport.id}`;
        }

        if (!routeStart) return null;

        return (
          <RoutingMachine
            key={routeKey}
            start={routeStart}
            end={[Number(selectedReport.fire_latitude), Number(selectedReport.fire_longitude)]}
          />
        );
      })()}
    </MapContainer>
  );
}

```

---

## Modul 16: Komponen Visualisasi Sebaran Titik Panas (Hotspot Map)
- **Path File:** `src/components/HotspotMap.tsx`
- **Jumlah Baris:** 152 baris
- **Fungsi:** Peta visualisasi persebaran tingkat kerawanan dan titik panas kebakaran untuk mitigasi pencegahan dini.

```tsx
'use client';

import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useMemo } from 'react';

interface Hotspot {
    fire_latitude: number;
    fire_longitude: number;
    kelurahan_name: string;
    category_name: string;
    category_icon: string;
    created_at: string;
}

interface HotspotMapProps {
    hotspots: Hotspot[];
    year: number;
}

// Create custom icon based on category
const createHotspotIcon = (icon: string) => {
    return new L.DivIcon({
        html: `<div style="font-size: 20px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">${icon}</div>`,
        className: 'leaflet-emoji-icon',
        iconSize: [20, 20],
        iconAnchor: [10, 20],
    });
};

// Group hotspots by location
const groupHotspotsByLocation = (hotspots: Hotspot[]) => {
    const groups: { [key: string]: { lat: number; lng: number; count: number; items: Hotspot[] } } = {};

    hotspots.forEach(spot => {
        // Round to 4 decimal places to group nearby points
        const key = `${Number(spot.fire_latitude).toFixed(4)},${Number(spot.fire_longitude).toFixed(4)}`;
        if (!groups[key]) {
            groups[key] = {
                lat: Number(spot.fire_latitude),
                lng: Number(spot.fire_longitude),
                count: 0,
                items: [],
            };
        }
        groups[key].count++;
        groups[key].items.push(spot);
    });

    return Object.values(groups);
};

export default function HotspotMap({ hotspots, year }: HotspotMapProps) {
    const defaultPosition: [number, number] = [-3.0073, 104.8156]; // Pusat Plaju

    // Group hotspots for heatmap-like visualization
    const groupedHotspots = useMemo(() => groupHotspotsByLocation(hotspots), [hotspots]);

    // Get max count for scaling
    const maxCount = useMemo(() => Math.max(...groupedHotspots.map(g => g.count), 1), [groupedHotspots]);

    return (
        <MapContainer
            center={defaultPosition}
            zoom={14}
            style={{ height: '100%', width: '100%', backgroundColor: '#ffffff' }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            {/* Render circle markers for hotspot intensity */}
            {groupedHotspots.map((group, index) => {
                const intensity = group.count / maxCount;
                const radius = Math.max(15, intensity * 50);

                return (
                    <CircleMarker
                        key={`circle-${index}`}
                        center={[group.lat, group.lng]}
                        radius={radius}
                        pathOptions={{
                            color: intensity > 0.7 ? '#8B1816' : intensity > 0.4 ? '#DD2C28' : '#EAB308',
                            fillColor: intensity > 0.7 ? '#8B1816' : intensity > 0.4 ? '#DD2C28' : '#EAB308',
                            fillOpacity: 0.4,
                            weight: 2,
                        }}
                    >
                        <Popup>
                            <div className="text-center">
                                <p className="font-bold text-red-600">{group.count} Kejadian</p>
                                <p className="text-xs text-gray-600">di lokasi ini</p>
                                <hr className="my-2" />
                                <p className="text-xs font-medium">Kelurahan: {group.items[0]?.kelurahan_name || 'Tidak Diketahui'}</p>
                            </div>
                        </Popup>
                    </CircleMarker>
                );
            })}

            {/* Render individual markers */}
            {hotspots.map((spot, index) => (
                <Marker
                    key={`hotspot-${index}`}
                    position={[Number(spot.fire_latitude), Number(spot.fire_longitude)]}
                    icon={createHotspotIcon(spot.category_icon || '🔥')}
                >
                    <Popup>
                        <div className="min-w-[150px]">
                            <p className="font-bold text-gray-800">
                                {spot.category_icon} {spot.category_name || 'Kebakaran'}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                                📍 {spot.kelurahan_name || 'Lokasi Tidak Diketahui'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                📅 {new Date(spot.created_at).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                })}
                            </p>
                        </div>
                    </Popup>
                </Marker>
            ))}

            {/* Legend */}
            <div className="leaflet-bottom leaflet-right" style={{ pointerEvents: 'auto' }}>
                <div className="bg-white p-3 rounded-lg shadow-lg m-3 text-xs">
                    <p className="font-semibold text-gray-800 mb-2">📊 Legenda</p>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-red-600 opacity-60"></div>
                            <span>Tinggi (&gt;70%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-orange-500 opacity-60"></div>
                            <span>Sedang (40-70%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-yellow-500 opacity-60"></div>
                            <span>Rendah (&lt;40%)</span>
                        </div>
                    </div>
                </div>
            </div>
        </MapContainer>
    );
}

```

---

## Modul 17: Komponen Pemantauan Pergerakan Real-Time Armada Damkar
- **Path File:** `src/components/LiveTrackingMap.tsx`
- **Jumlah Baris:** 154 baris
- **Fungsi:** Visualisasi langsung pergerakan armada damkar di peta saat menuju ke lokasi titik api dengan animasi marker dinamis.

```tsx
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Ikon kustom untuk mobil pemadam kebakaran
const fireTruckIcon = new L.DivIcon({
  html: `
        <div style="position: relative; width: 40px; height: 40px;">
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 30px;
                height: 30px;
                background-color: rgba(37, 99, 235, 0.3);
                border-radius: 50%;
                animation: pulse-truck 2s infinite;
            "></div>
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 28px;
                text-align: center;
                line-height: 28px;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
            ">🚒</div>
        </div>
        <style>
            @keyframes pulse-truck {
                0%, 100% {
                    width: 30px;
                    height: 30px;
                    opacity: 1;
                }
                50% {
                    width: 45px;
                    height: 45px;
                    opacity: 0.5;
                }
            }
        </style>
    `,
  className: 'leaflet-truck-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// Ikon untuk lokasi kejadian kebakaran
const fireLocationIcon = new L.DivIcon({
  html: `
        <div style="position: relative; width: 40px; height: 40px;">
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 30px;
                height: 30px;
                background-color: rgba(239, 68, 68, 0.3);
                border-radius: 50%;
                animation: pulse-fire 2s infinite;
            "></div>
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 32px;
                text-align: center;
                line-height: 32px;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
            ">🔥</div>
        </div>
        <style>
            @keyframes pulse-fire {
                0%, 100% {
                    width: 30px;
                    height: 30px;
                    opacity: 1;
                }
                50% {
                    width: 45px;
                    height: 45px;
                    opacity: 0.5;
                }
            }
        </style>
    `,
  className: 'leaflet-fire-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// Komponen untuk otomatis menyesuaikan bounds (menampilkan kedua marker jika ada)
function AutoFitBounds({ firePos, petugasPos }: { firePos: [number, number], petugasPos: [number, number] | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (firePos && petugasPos) {
      const bounds = L.latLngBounds([firePos, petugasPos]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    } else if (firePos) {
      map.setView(firePos, 15);
    }
  }, [firePos, petugasPos, map]);

  return null;
}

interface LiveTrackingMapProps {
  firePosition: [number, number];
  petugasPosition: [number, number] | null;
  petugasName?: string;
}

export default function LiveTrackingMap({ firePosition, petugasPosition, petugasName }: LiveTrackingMapProps) {
  return (
    <div className="w-full h-full min-h-[300px] rounded-xl overflow-hidden border border-gray-200" style={{ zIndex: 0 }}>
      <MapContainer 
        center={firePosition} 
        zoom={15} 
        style={{ height: '100%', width: '100%', minHeight: '300px', zIndex: 0 }}
        zoomControl={false}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        <Marker position={firePosition} icon={fireLocationIcon}>
          <Popup>📍 Lokasi Kejadian</Popup>
        </Marker>

        {petugasPosition && (
          <Marker position={petugasPosition} icon={fireTruckIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-bold text-blue-600">🚒 Unit Meluncur</p>
                <p className="text-xs text-gray-600">{petugasName || 'Petugas'}</p>
              </div>
            </Popup>
          </Marker>
        )}

        <AutoFitBounds firePos={firePosition} petugasPos={petugasPosition} />
      </MapContainer>
    </div>
  );
}

```

---

## Modul 18: Komponen Penentuan Rute Evakuasi & Jalur Tercepat (Emergency Routing)
- **Path File:** `src/components/RoutingMachine.tsx`
- **Jumlah Baris:** 272 baris
- **Fungsi:** Implementasi Leaflet Routing Machine untuk menghitung jalur tercepat dari posko pemadam terdekat menuju lokasi kejadian.

```tsx
import L from "leaflet";
import { useMap } from "react-leaflet";
import { useEffect, useRef, useCallback } from "react";

interface RoutingMachineProps {
  start: [number, number];
  end: [number, number];
  onRouteFound?: (summary: { totalDistance: number; totalTime: number }) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

const RoutingMachine = ({ start, end, onRouteFound, onLoadingChange }: RoutingMachineProps) => {
  const map = useMap();
  const animationRef = useRef<number | null>(null);
  const onRouteFoundRef = useRef(onRouteFound);
  const onLoadingChangeRef = useRef(onLoadingChange);
  const lastRouteKey = useRef<string>("");
  const fetchControllerRef = useRef<AbortController | null>(null);
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routeRequestIdRef = useRef(0);
  const fallbackPolylineRef = useRef<L.Polyline | null>(null);
  const animatedPolylineRef = useRef<L.Polyline | null>(null);
  const movingMarkerRef = useRef<L.Marker | null>(null);

  const clearRouteLayers = useCallback(() => {
    if (fallbackPolylineRef.current) {
      map.removeLayer(fallbackPolylineRef.current);
      fallbackPolylineRef.current = null;
    }
    if (animatedPolylineRef.current) {
      map.removeLayer(animatedPolylineRef.current);
      animatedPolylineRef.current = null;
    }
    if (movingMarkerRef.current) {
      map.removeLayer(movingMarkerRef.current);
      movingMarkerRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, [map]);
  
  // Update ref when callback changes
  useEffect(() => {
    onRouteFoundRef.current = onRouteFound;
  }, [onRouteFound]);

  useEffect(() => {
    onLoadingChangeRef.current = onLoadingChange;
  }, [onLoadingChange]);

  useEffect(() => {
    if (!map) return;

    let didCleanup = false;
    routeRequestIdRef.current += 1;
    const currentRequestId = routeRequestIdRef.current;

    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = null;
    }

    if (fetchControllerRef.current) {
      fetchControllerRef.current.abort();
      fetchControllerRef.current = null;
    }

    clearRouteLayers();

    // Icon untuk marker yang bergerak (mobil pemadam)
    const truckIcon = L.divIcon({
      html: `
        <div style="
          font-size: 24px;
          text-align: center;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
          animation: bounce 1s infinite;
        ">🚒</div>
        <style>
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }
        </style>
      `,
      className: 'moving-truck-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 24],
    });

    // Fungsi untuk animasi route seperti Gojek
    const animateRoute = (coordinates: L.LatLngExpression[], duration: number = 2500) => {
      const startTime = Date.now();
      const totalPoints = coordinates.length;
      
      // Buat polyline untuk animasi
      animatedPolylineRef.current = L.polyline([], {
        color: '#9F1C19',
        weight: 6,
        opacity: 0.8,
        lineJoin: 'round',
        lineCap: 'round',
      }).addTo(map);

      // Tambahkan marker mobil pemadam yang bergerak
      movingMarkerRef.current = L.marker(coordinates[0] as L.LatLngExpression, {
        icon: truckIcon,
        zIndexOffset: 1000,
      }).addTo(map);

      // Fungsi animasi frame by frame
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function untuk animasi smooth (ease-out)
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        // Hitung berapa banyak point yang harus ditampilkan
        const currentPointIndex = Math.floor(easeProgress * totalPoints);
        
        // Update polyline dengan koordinat sampai index saat ini
        const currentCoords = coordinates.slice(0, currentPointIndex + 1);
        animatedPolylineRef.current?.setLatLngs(currentCoords);
        
        // Update posisi marker mobil pemadam
        if (currentPointIndex < totalPoints && movingMarkerRef.current) {
          movingMarkerRef.current.setLatLng(coordinates[currentPointIndex] as L.LatLngExpression);
        }
        
        if (progress < 1) {
          // Lanjutkan animasi
          animationRef.current = requestAnimationFrame(animate);
        } else {
          // Animasi selesai - hapus marker
          if (movingMarkerRef.current) {
            map.removeLayer(movingMarkerRef.current);
            movingMarkerRef.current = null;
          }
          animationRef.current = null;
        }
      };

      // Mulai animasi
      animate();
    };

    const fetchRoute = async () => {
      try {
        // Validasi koordinat
        if (!start || !end || start.length !== 2 || end.length !== 2) {
          return;
        }
        
        // Cek apakah route sudah sama dengan sebelumnya
        const routeKey = `${start[0]},${start[1]}-${end[0]},${end[1]}`;
        if (routeKey === lastRouteKey.current) {
          onLoadingChangeRef.current?.(false);
          return; // Skip jika route sama
        }
        lastRouteKey.current = routeKey;

        const controller = new AbortController();
        fetchControllerRef.current = controller;

        // PENTING: start dan end sudah dalam format [lat, lng] dari Leaflet
        // OSRM API membutuhkan format: longitude,latitude (dibalik!)
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&alternatives=false&steps=true&annotations=true`;

        const response = await fetch(osrmUrl, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          }
        });

        if (didCleanup || currentRequestId !== routeRequestIdRef.current) return;

        if (!response.ok) {
          throw new Error(`OSRM API error: ${response.status}`);
        }

        const data = await response.json();

        // FIX: Re-check if component unmounted while awaiting response.json()
        if (didCleanup || currentRequestId !== routeRequestIdRef.current) return;

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coordinates = route.geometry.coordinates;

          if (!coordinates || coordinates.length === 0) {
            throw new Error('No coordinates in route geometry');
          }

          // PENTING: OSRM mengembalikan koordinat dalam format [lng, lat]
          // Leaflet membutuhkan format [lat, lng], jadi harus dibalik!
          const latlngs: L.LatLngExpression[] = coordinates.map((coord: number[]) => [coord[1], coord[0]]);

          clearRouteLayers();

          // Mulai animasi route (durasi 2.5 detik)
          animateRoute(latlngs, 2500);
          
          // Fit bounds ke rute dengan animasi smooth
          const tempPolyline = L.polyline(latlngs);
          const bounds = tempPolyline.getBounds();
          map.fitBounds(bounds, {
            padding: [80, 80],
            maxZoom: 15,
            animate: true,
            duration: 1
          });

          // Kirim summary ke parent component
          if (onRouteFoundRef.current) {
            onRouteFoundRef.current({
              totalDistance: route.distance, // dalam meter
              totalTime: route.duration, // dalam detik
            });
          }
        } else {
          throw new Error(data.message || 'No route found');
        }
      } catch (error: unknown) {
        if (didCleanup || currentRequestId !== routeRequestIdRef.current) return;
        if (error instanceof Error && error.name === 'AbortError') return;

        // Fallback: gunakan garis lurus jika routing gagal
        clearRouteLayers();

        fallbackPolylineRef.current = L.polyline([start, end], {
          color: '#9F1C19',
          weight: 4,
          opacity: 0.5,
          dashArray: '10, 10',
        }).addTo(map);

        const bounds = L.latLngBounds([start, end]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      } finally {
        if (!didCleanup && currentRequestId === routeRequestIdRef.current) {
          onLoadingChangeRef.current?.(false);
        }
      }
    };

    // Debounce fetch untuk menghindari spam request saat drag cepat
    onLoadingChangeRef.current?.(true);
    fetchTimeoutRef.current = setTimeout(fetchRoute, 500);

    return () => {
      didCleanup = true;
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
      if (fetchControllerRef.current) {
        fetchControllerRef.current.abort();
        fetchControllerRef.current = null;
      }
      clearRouteLayers();
      onLoadingChangeRef.current?.(false);
    };
  }, [map, start[0], start[1], end[0], end[1], clearRouteLayers]);

  return null;
};

export default RoutingMachine;

```

---

## Modul 19: Komponen Antarmuka Pusat Komando & Verifikasi Insiden (Command Center)
- **Path File:** `src/components/ReportDetailModal.tsx`
- **Jumlah Baris:** 824 baris
- **Fungsi:** Dialog antarmuka bagi operator untuk mengecek detail foto, deskripsi, kontak pelapor, memilih regu damkar, dan dispatch instan.

```tsx
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { toSafeExternalUrl } from "@/lib/url-safety";

const AdminMap = dynamic(() => import("./AdminMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
      <div className="flex flex-col items-center gap-2">
        <div className="animate-spin h-6 w-6 border-2 border-gray-400 border-t-transparent rounded-full"></div>
        <span className="text-xs">Memuat Peta...</span>
      </div>
    </div>
  ),
});
import {
  FaTimes,
  FaMapMarkerAlt,
  FaClock,
  FaPhone,
  FaFileAlt,
  FaImage,
  FaCheck,
  FaTruck,
  FaCheckCircle,
  FaTimesCircle,
  FaTrash,
  FaUser,
} from "react-icons/fa";

interface Report {
  id: number;
  user_id?: number | null;
  phone_number: string;
  fire_latitude: number;
  fire_longitude: number;
  reporter_latitude?: number;
  reporter_longitude?: number;
  status: string;
  created_at: string;
  media_url: string;
  notes?: string;
  contact?: string;
  description?: string;
  address?: string;
  guest_name?: string | null;
  user_name?: string | null;
  assigned_petugas_id?: number | null;
  assigned_petugas_name?: string | null;
  dispatched_at?: string | null;
  accepted_at?: string | null;
  arrived_at?: string | null;
  completed_at?: string | null;
  response_time_seconds?: number | null;
  status_petugas?: string | null;
  completion_photo_url?: string | null;
  needs_backup?: number | boolean;
  petugas_notes?: string | null;
  category?: {
    id: number;
    name: string;
    icon: string;
  };
  kelurahan?: {
    id: number;
    name: string;
  };
}

interface ReportDetailModalProps {
  report: Report;
  onClose: () => void;
  onUpdateStatus?: (reportId: number, newStatus: string) => Promise<void>;
  onDispatchToPetugas?: (reportId: number) => Promise<void>;
  onDelete?: (reportId: number) => Promise<void>;
  readOnly?: boolean;
}

const StatusButton = ({
  label,
  icon,
  color,
  onClick,
  disabled = false,
}: {
  label: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`${color} text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all hover:shadow-md shadow-xs disabled:opacity-50 disabled:cursor-not-allowed active:scale-95`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default function ReportDetailModal({
  report,
  onClose,
  onUpdateStatus,
  onDispatchToPetugas,
  onDelete,
  readOnly = false,
}: ReportDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [kelurahanList, setKelurahanList] = useState<{ id: number; name: string }[]>([]);
  const [selectedKelurahan, setSelectedKelurahan] = useState<number | null>(report.kelurahan?.id || null);
  const [isEditingKelurahan, setIsEditingKelurahan] = useState(false);
  // State lokal untuk kelurahan agar tidak mutasi prop
  const [localKelurahan, setLocalKelurahan] = useState<{ id: number; name: string } | null | undefined>(report.kelurahan);

  // Fetch kelurahan list
  useEffect(() => {
    const fetchKelurahan = async () => {
      try {
        const res = await fetch('/api/kelurahan');
        const data = await res.json();
        if (data.success) setKelurahanList(data.data);
      } catch (err) {
        console.error('Error fetching kelurahan:', err);
      }
    };
    if (!readOnly) fetchKelurahan();
  }, [readOnly]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!onUpdateStatus || readOnly) return;
    setIsUpdating(true);
    try {
      await onUpdateStatus(report.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDispatch = async () => {
    if (!onDispatchToPetugas || readOnly) return;
    setIsUpdating(true);
    try {
      await onDispatchToPetugas(report.id);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || readOnly) return;
    setIsUpdating(true);
    try {
      await onDelete(report.id);
      onClose();
    } finally {
      setIsUpdating(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSaveKelurahan = async () => {
    if (!selectedKelurahan) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/operator/reports/${report.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kelurahanId: selectedKelurahan }),
      });
      if (res.ok) {
        setIsEditingKelurahan(false);
        // Update via callback agar parent state ikut terupdate (tidak mutasi prop)
        const found = kelurahanList.find(k => k.id === selectedKelurahan);
        if (found && onUpdateStatus) {
          // Trigger parent refresh — gunakan status yang sama agar tidak kirim notif
          // Cukup tutup edit mode, parent akan refresh saat next fetch
        }
        // Update tampilan lokal sementara (tidak mutasi prop, pakai state)
        setLocalKelurahan(found ?? null);
      } else {
        alert('Gagal menyimpan kelurahan. Coba lagi.');
      }
    } catch (err) {
      console.error('Error updating kelurahan:', err);
      alert('Terjadi kesalahan. Coba lagi.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const getStatusDisplay = (status: string) => {
    const statusMap: { [key: string]: { text: string; color: string; bgColor: string } } = {
      pending: { text: "Baru", color: "text-red-600", bgColor: "bg-red-50 border-red-200" },
      submitted: { text: "Baru", color: "text-red-600", bgColor: "bg-red-50 border-red-200" },
      verified: { text: "Diverifikasi", color: "text-yellow-600", bgColor: "bg-yellow-50 border-yellow-200" },
      diproses: { text: "Sedang Diproses", color: "text-blue-600", bgColor: "bg-blue-50 border-blue-200" },
      in_progress: { text: "Sedang Ditangani", color: "text-cyan-600", bgColor: "bg-cyan-50 border-cyan-200" },
      dispatched: { text: "Dikirim", color: "text-blue-600", bgColor: "bg-blue-50 border-blue-200" },
      dikirim: { text: "Tim Dikirim", color: "text-purple-600", bgColor: "bg-purple-50 border-purple-200" },
      arrived: { text: "Tiba", color: "text-indigo-600", bgColor: "bg-indigo-50 border-indigo-200" },
      ditangani: { text: "Sedang Ditangani", color: "text-cyan-600", bgColor: "bg-cyan-50 border-cyan-200" },
      completed: { text: "Selesai", color: "text-green-600", bgColor: "bg-green-50 border-green-200" },
      selesai: { text: "Selesai", color: "text-green-600", bgColor: "bg-green-50 border-green-200" },
      dibatalkan: { text: "Dibatalkan", color: "text-red-600", bgColor: "bg-red-50 border-red-200" },
      false: { text: "Laporan Palsu", color: "text-gray-600", bgColor: "bg-gray-50 border-gray-200" },
      false_report: { text: "Laporan Palsu", color: "text-gray-600", bgColor: "bg-gray-50 border-gray-200" },
    };
    return (
      statusMap[status] || { text: status, color: "text-gray-600", bgColor: "bg-gray-50 border-gray-200" }
    );
  };

  const statusDisplay = getStatusDisplay(report.status);
  const safeMediaUrl = toSafeExternalUrl(report.media_url);

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200/60 px-4 py-3.5 sm:px-6 sm:py-5 flex justify-between items-center z-10 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl shrink-0">
              <FaFileAlt className="text-white text-sm sm:text-base" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">Detail Laporan #{report.id}</h2>
                {report.needs_backup == 1 && (
                  <span className="bg-red-500 text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse shadow-xs">
                    🚨 BUTUH BACKUP
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">Informasi lengkap laporan kebakaran</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all p-2 rounded-xl shrink-0 ml-2"
            aria-label="Close modal"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* SOS Backup Banner */}
        {report.needs_backup ? (
          <div className="bg-red-600 px-6 py-3 flex items-center justify-between text-white shadow-inner animate-pulse">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚨</span>
              <div>
                <p className="font-bold text-sm tracking-wide uppercase">PETUGAS MEMBUTUHKAN BANTUAN ARMADA</p>
                <p className="text-xs text-red-100 mt-0.5">Skala api besar, segera kirimkan unit pemadam tambahan ke lokasi ini!</p>
              </div>
            </div>
            {!readOnly && onUpdateStatus && (
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/operator/reports/${report.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ needsBackup: false }),
                    });
                    if (res.ok) {
                      // Tutup modal agar list refresh, atau panggil onUpdateStatus dengan status saat ini untuk me-trigger reload
                      await onUpdateStatus(report.id, report.status);
                      onClose();
                    } else {
                      alert('Gagal memproses. Coba lagi.');
                    }
                  } catch (e) {
                    alert('Terjadi kesalahan jaringan.');
                  }
                }}
                className="bg-white text-red-700 px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-red-50 transition-colors whitespace-nowrap"
              >
                Tanggapi Bantuan
              </button>
            )}
          </div>
        ) : null}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gray-50/30">
          {/* Status */}
          <div className={`rounded-xl p-5 border ${statusDisplay.bgColor}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Status Laporan</p>
                  <p className={`text-xl font-semibold ${statusDisplay.color}`}>
                    {statusDisplay.text}
                  </p>
                </div>
              </div>
              {report.assigned_petugas_name && (
                <div className="bg-white/60 p-3 rounded-lg border border-gray-200/50">
                  <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1">Diambil Oleh Petugas</p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-700">{report.assigned_petugas_name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{report.assigned_petugas_name}</p>
                      {report.accepted_at && (
                        <p className="text-xs text-gray-500">
                          {new Date(report.accepted_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB
                        </p>
                      )}
                      {report.status_petugas && (
                        <div className="mt-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            report.status_petugas === 'accepted' ? 'bg-yellow-100 text-yellow-700' :
                            report.status_petugas === 'arrived' ? 'bg-blue-100 text-blue-700' :
                            report.status_petugas === 'completed' ? 'bg-green-100 text-green-700' :
                            report.status_petugas === 'false_report' ? 'bg-gray-100 text-gray-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {report.status_petugas === 'accepted' ? 'Menuju Lokasi' :
                             report.status_petugas === 'arrived' ? 'Tiba di Lokasi' :
                             report.status_petugas === 'completed' ? 'Selesai' :
                             report.status_petugas === 'false_report' ? 'Laporan Palsu' :
                             report.status_petugas}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timing Metrics */}
          {(report.status_petugas === 'completed' || report.status_petugas === 'false_report') && report.dispatched_at && report.arrived_at && report.completed_at && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm flex flex-col items-center justify-center text-center">
                <p className="text-[11px] uppercase font-bold text-gray-500 tracking-wider mb-1">Waktu Respon</p>
                <p className="text-lg font-bold text-blue-700">
                  {Math.max(0, Math.floor((new Date(report.arrived_at).getTime() - new Date(report.dispatched_at).getTime()) / 60000))} Menit
                </p>
                <p className="text-[10px] text-gray-400 mt-1">Dikirim ➔ Tiba</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-orange-100 shadow-sm flex flex-col items-center justify-center text-center">
                <p className="text-[11px] uppercase font-bold text-gray-500 tracking-wider mb-1">Waktu Penanganan</p>
                <p className="text-lg font-bold text-orange-700">
                  {Math.max(0, Math.floor((new Date(report.completed_at).getTime() - new Date(report.arrived_at).getTime()) / 60000))} Menit
                </p>
                <p className="text-[10px] text-gray-400 mt-1">Tiba ➔ Selesai</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-green-100 shadow-sm flex flex-col items-center justify-center text-center">
                <p className="text-[11px] uppercase font-bold text-gray-500 tracking-wider mb-1">Total Waktu</p>
                <p className="text-lg font-bold text-green-700">
                  {Math.max(0, Math.floor((new Date(report.completed_at).getTime() - new Date(report.dispatched_at).getTime()) / 60000))} Menit
                </p>
                <p className="text-[10px] text-gray-400 mt-1">Dikirim ➔ Selesai</p>
              </div>
            </div>
          )}

          {/* Kategori dan Kelurahan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kategori Bencana */}
            <div className="bg-white rounded-xl p-5 border border-gray-200/60 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <span className="text-lg">{report.category?.icon || '🔥'}</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1.5">Kategori Bencana</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {report.category?.name || 'Kebakaran'}
                  </p>
                </div>
              </div>
            </div>

            {/* Kelurahan */}
            <div className="bg-white rounded-xl p-5 border border-gray-200/60 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <FaMapMarkerAlt className="text-teal-600 text-sm" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1.5">Kelurahan</p>
                  {isEditingKelurahan && !readOnly ? (
                    <div className="flex gap-2">
                      <select
                        value={selectedKelurahan || ''}
                        onChange={(e) => setSelectedKelurahan(Number(e.target.value))}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      >
                        <option value="">Pilih Kelurahan</option>
                        {kelurahanList.map((kel) => (
                          <option key={kel.id} value={kel.id}>{kel.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleSaveKelurahan}
                        className="px-3 py-2 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600"
                      >
                        Simpan
                      </button>
                      <button
                        onClick={() => setIsEditingKelurahan(false)}
                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-300"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {localKelurahan?.name || 'Tidak tersedia'}
                      </p>
                      {!readOnly && (
                        <button
                          onClick={() => setIsEditingKelurahan(true)}
                          className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Informasi Pelapor */}
          <div className="bg-white rounded-xl p-5 border border-gray-200/60 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FaUser className="text-purple-600 text-sm" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">Informasi Pelapor</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">
                    {report.user_name || report.guest_name || 'Tidak diketahui'}
                  </p>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${report.user_id ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                    {report.user_id ? 'Terdaftar' : 'Guest'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Deskripsi */}
          {report.description && (
            <div className="bg-white rounded-xl p-5 border border-gray-200/60 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FaFileAlt className="text-blue-600 text-sm" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-2">Deskripsi Kejadian</p>
                  <p className="text-sm text-gray-900 leading-relaxed">{report.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Alamat */}
          {report.address && (
            <div className="bg-white rounded-xl p-5 border border-gray-200/60 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FaMapMarkerAlt className="text-orange-600 text-sm" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-2">Alamat/Patokan</p>
                  <p className="text-sm text-gray-900 leading-relaxed">{report.address}</p>
                </div>
              </div>
            </div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Waktu */}
            <div className="bg-white rounded-xl p-5 border border-gray-200/60 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <FaClock className="text-yellow-600 text-sm" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1.5">Waktu Laporan</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(report.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      timeZone: "Asia/Jakarta",
                    })}
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {new Date(report.created_at).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      timeZone: "Asia/Jakarta",
                    })} WIB
                  </p>
                </div>
              </div>
            </div>

            {/* Kontak */}
            <div className="bg-white rounded-xl p-5 border border-gray-200/60 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FaPhone className="text-green-600 text-sm" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1.5">Nomor Telepon</p>
                  <p className="text-sm font-semibold text-gray-900 font-mono">
                    {report.phone_number}
                  </p>
                  {report.contact && (
                    <p className="text-xs text-gray-600 mt-1">{report.contact}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Lokasi Kebakaran */}
          <div className="bg-white rounded-xl p-5 border border-gray-200/60 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <FaMapMarkerAlt className="text-red-600 text-sm" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-2">🔥 Lokasi Kebakaran</p>
                <p className="text-sm text-gray-900 font-mono">
                  Lat: {Number(report.fire_latitude).toFixed(6)}
                </p>
                <p className="text-sm text-gray-900 font-mono">
                  Lng: {Number(report.fire_longitude).toFixed(6)}
                </p>
                <a
                  href={`https://www.google.com/maps?q=${report.fire_latitude},${report.fire_longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-xs font-medium mt-2 inline-flex items-center gap-1 hover:underline"
                >
                  Buka di Google Maps →
                </a>
              </div>
            </div>
          </div>

          {/* Lokasi Pelapor */}
          {report.reporter_latitude && report.reporter_longitude && (
            <div className="bg-white rounded-xl p-5 border border-gray-200/60 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FaMapMarkerAlt className="text-blue-600 text-sm" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-2">📍 Lokasi Pelapor</p>
                  <p className="text-sm text-gray-900 font-mono">
                    Lat: {Number(report.reporter_latitude).toFixed(6)}
                  </p>
                  <p className="text-sm text-gray-900 font-mono">
                    Lng: {Number(report.reporter_longitude).toFixed(6)}
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${report.reporter_latitude},${report.reporter_longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-xs font-medium mt-2 inline-flex items-center gap-1 hover:underline"
                  >
                    Buka di Google Maps →
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Catatan */}
          {report.notes && (
            <div className="bg-white rounded-xl p-5 border border-gray-200/60 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FaFileAlt className="text-blue-600 text-sm" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-2">Catatan</p>
                  <p className="text-sm text-gray-900 leading-relaxed">{report.notes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Peta Rute Kebakaran */}
          <div className="bg-white rounded-xl p-5 border border-gray-200/60 shadow-sm overflow-hidden">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FaMapMarkerAlt className="text-orange-600 text-sm" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Rute Pemadam Kebakaran</p>
                <p className="text-sm font-semibold text-gray-900">
                  Estimasi Rute Tercepat
                </p>
              </div>
            </div>
            <div className="w-full h-80 rounded-lg overflow-hidden border border-gray-200 relative z-0">
              <AdminMap
                reports={[report]}
                selectedReport={report}
                onReportClick={() => { }}
              />
            </div>
          </div>

          {/* Media */}
          {safeMediaUrl && (
            <div className="bg-white rounded-xl p-5 border border-gray-200/60 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FaImage className="text-purple-600 text-sm" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-3">Media Lampiran</p>
                  <div className="relative w-full h-64 rounded-xl overflow-hidden border border-gray-200">
                    <Image
                      src={safeMediaUrl}
                      alt="Bukti laporan"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <a
                    href={safeMediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-xs font-medium mt-3 inline-flex items-center gap-1 hover:underline"
                  >
                    Lihat Ukuran Penuh →
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Bukti Penyelesaian */}
          {report.completion_photo_url && (
            <div className="bg-white rounded-xl p-5 border border-green-200 shadow-sm bg-green-50/30">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FaCheckCircle className="text-green-600 text-sm" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-green-700 font-semibold mb-3">Bukti Penyelesaian (Dari Petugas)</p>
                  <div className="relative w-full h-64 rounded-xl overflow-hidden border border-green-200">
                    <Image
                      src={toSafeExternalUrl(report.completion_photo_url) || ''}
                      alt="Bukti penyelesaian laporan"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <a
                    href={toSafeExternalUrl(report.completion_photo_url) || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-700 hover:text-green-800 text-xs font-medium mt-3 inline-flex items-center gap-1 hover:underline"
                  >
                    Lihat Ukuran Penuh →
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Catatan Lapangan dari Petugas */}
          {report.petugas_notes && (
            <div className="bg-white rounded-xl p-5 border border-purple-200 shadow-sm bg-purple-50/30">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FaFileAlt className="text-purple-600 text-sm" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-purple-700 font-semibold mb-2">Catatan Lapangan (Dari Petugas)</p>
                  <p className="text-sm text-gray-900 leading-relaxed bg-white p-3 rounded-lg border border-purple-100">{report.petugas_notes}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!readOnly && onUpdateStatus && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200/60 px-4 py-3 sm:px-6 sm:py-4 shrink-0">
            <p className="text-[11px] sm:text-xs font-semibold text-gray-500 mb-2">Ubah Status Laporan:</p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-2 sm:gap-2.5">
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 sm:gap-2.5 flex-1">
                <StatusButton
                  label="Verifikasi"
                  icon={<FaCheck className="text-xs sm:text-sm" />}
                  color="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700"
                  onClick={() => handleStatusUpdate("verified")}
                  disabled={report.status === 'completed' || report.status === 'false' || report.status === 'false_report'}
                />
                {onDispatchToPetugas && (
                  <StatusButton
                    label={report.assigned_petugas_id ? "Sudah Diambil" : report.status === 'dispatched' || report.status === 'dikirim' ? "Terkirim" : "Broadcast Petugas"}
                    icon={<FaTruck className="text-xs sm:text-sm" />}
                    color="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700"
                    onClick={handleDispatch}
                    disabled={!!report.assigned_petugas_id || report.status === 'completed' || report.status === 'selesai' || report.status === 'false' || report.status === 'false_report' || report.status === 'dispatched' || report.status === 'dikirim'}
                  />
                )}
                <StatusButton
                  label="Kirim Unit (Manual)"
                  icon={<FaTruck className="text-xs sm:text-sm" />}
                  color="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
                  onClick={() => handleStatusUpdate("dispatched")}
                  disabled={!!report.assigned_petugas_id || report.status === 'completed' || report.status === 'selesai' || report.status === 'false' || report.status === 'false_report' || report.status === 'dispatched' || report.status === 'dikirim'}
                />
                <StatusButton
                  label="Selesaikan"
                  icon={<FaCheckCircle className="text-xs sm:text-sm" />}
                  color="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  onClick={() => handleStatusUpdate("completed")}
                  disabled={report.status === 'completed' || report.status === 'false' || report.status === 'false_report'}
                />
                <StatusButton
                  label="Laporan Palsu"
                  icon={<FaTimesCircle className="text-xs sm:text-sm" />}
                  color="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700"
                  onClick={() => handleStatusUpdate("false")}
                  disabled={report.status === 'completed' || report.status === 'false' || report.status === 'false_report'}
                />
              </div>
              {/* Tombol Hapus */}
              {onDelete && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-all active:scale-95"
                >
                  <FaTrash className="text-xs" />
                  Hapus
                </button>
              )}
            </div>
          </div>
        )}

        {/* Dialog Konfirmasi Hapus */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
            <div className="bg-white rounded-2xl p-6 shadow-xl mx-4 max-w-sm w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <FaTrash className="text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Hapus Laporan?</h3>
                  <p className="text-xs text-gray-500">Laporan #{report.id}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-5">
                Laporan ini akan dihapus permanen beserta notifikasinya. Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-all"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        )}

        {isUpdating && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
            <div className="bg-white rounded-xl p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-3 border-solid border-red-500 border-r-transparent"></div>
                <p className="text-sm font-medium text-gray-900">Memperbarui status...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

```

---

# BAGIAN V: ANTARMUKA PELAPORAN MASYARAKAT (CITIZEN INTERFACE)

## Modul 20: Antarmuka Formulir Pelaporan Darurat Berbasis GPS Otomatis
- **Path File:** `src/app/report/new/page.tsx`
- **Jumlah Baris:** 612 baris
- **Fungsi:** Halaman pelaporan lengkap untuk masyarakat dengan deteksi lokasi otomatis via browser Geolocation API, upload foto, dan pemilihan kategori bencana.

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { NearestStationInfo } from "@/components/ReportMap";
import { useModal } from "@/hooks/useModal";
import { useToast } from "@/hooks/useToast";
import Modal from "@/components/Modal";
import Toast from "@/components/Toast";
import {
  FaMapMarkerAlt,
  FaArrowLeft,
  FaFireExtinguisher,
  FaClock,
  FaRoad,
  FaExclamationTriangle,
  FaTimes,
  FaFire,
  FaUser,
  FaCheckCircle,
  FaSpinner,
  FaCloudUploadAlt,
  FaChevronDown,
  FaCrosshairs
} from "react-icons/fa";

const MapWithNoSSR = dynamic(() => import("@/components/ReportMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-50 flex items-center justify-center rounded-[2rem] border border-gray-100">
      <div className="text-center flex flex-col items-center">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold tracking-wide text-gray-400 mt-4 uppercase">Memuat Peta</p>
      </div>
    </div>
  ),
});

function MapInstructions() {
  const [show, setShow] = useState(true);
  if (!show) return null;

  return (
    <div className="mt-3 bg-slate-50 border border-slate-200/80 rounded-xl p-3 sm:p-4 relative select-none">
      <button 
        onClick={() => setShow(false)} 
        className="absolute top-2.5 right-2.5 text-gray-400 hover:text-gray-700 p-1 rounded-md transition-colors"
        aria-label="Tutup panduan"
      >
        <FaTimes className="text-xs" />
      </button>
      <div className="flex items-center gap-1.5 mb-1.5">
        <FaExclamationTriangle className="text-red-500 text-xs" />
        <h3 className="text-xs font-bold text-gray-900">Panduan Titik Lokasi</h3>
      </div>
      <ul className="space-y-1 text-[11px] sm:text-xs text-gray-600">
        <li className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
          <span><strong className="text-gray-900">Ketuk peta / seret marker merah</strong> ke titik lokasi kebakaran.</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-900 shrink-0"></span>
          <span>Gunakan tombol <strong className="text-gray-900">Set Lokasi GPS</strong> untuk akurasi instan.</span>
        </li>
      </ul>
    </div>
  );
}

function NearestStationInfoBox({ info }: { info: NearestStationInfo }) {
  const distanceInKm = (info.distance / 1000).toFixed(2);
  const timeInMinutes = Math.round(info.time / 60);

  return (
    <div className="mt-4 rounded-2xl bg-white border border-red-100 p-5 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 blur-[40px] pointer-events-none rounded-full"></div>

      <div className="flex items-center gap-3 mb-4 relative z-10">
        <div className="p-2 bg-red-50 text-red-600 rounded-xl">
          <FaFireExtinguisher className="text-base" />
        </div>
        <div>
          <h3 className="text-xs uppercase tracking-wider font-bold text-gray-400">Pos Pemadam Terdekat</h3>
          <p className="text-sm font-bold text-gray-900 leading-tight">{info.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 relative z-10">
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
          <p className="text-[10px] uppercase font-bold text-gray-400 mb-1 flex items-center gap-1.5"><FaRoad className="text-gray-400" /> Jarak</p>
          <p className="text-base font-bold text-gray-900 tracking-tight">{distanceInKm} km</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
          <p className="text-[10px] uppercase font-bold text-gray-400 mb-1 flex items-center gap-1.5"><FaClock className="text-gray-400" /> Estimasi</p>
          <p className="text-base font-bold text-gray-900 tracking-tight">~{timeInMinutes} Min</p>
        </div>
      </div>
    </div>
  );
}

export default function NewReportPage() {
  const router = useRouter();
  const { modal, error: showError } = useModal();
  const { toast, error: errorToast, hideToast } = useToast();

  const [firePosition, setFirePosition] = useState<[number, number] | null>(null);
  const [reporterPosition, setReporterPosition] = useState<[number, number] | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [contact, setContact] = useState("");
  const [categoryId, setCategoryId] = useState<number>(1);
  const [categories, setCategories] = useState<any[]>([]);
  const [kelurahanId, setKelurahanId] = useState<number | null>(null);
  const [kelurahanList, setKelurahanList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [nearestStation, setNearestStation] = useState<NearestStationInfo | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isGettingFireLocation, setIsGettingFireLocation] = useState(false);
  const [isGettingMyLocation, setIsGettingMyLocation] = useState(false);
  const [geoPermissionState, setGeoPermissionState] = useState<PermissionState | "unknown" | "unsupported">("unknown");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) router.replace("/login?redirect=/report/new");
      } catch {
        router.replace("/login?redirect=/report/new");
      } finally {
        setIsAuthenticating(false);
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/disaster-categories");
        if (response.ok) {
          const data = await response.json();
          if (data.success) setCategories(data.data);
        }
      } catch { }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchKelurahan = async () => {
      try {
        const response = await fetch("/api/kelurahan");
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setKelurahanList(data.data);
            const plajuDarat = data.data.find((kel: any) => kel.name.toLowerCase().includes("plaju darat"));
            if (plajuDarat) setKelurahanId((prev) => (prev === null ? plajuDarat.id : prev));
          }
        }
      } catch { }
    };
    fetchKelurahan();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const GEO_OPTIONS: PositionOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };

  const getGeoPermissionState = useCallback(async (): Promise<PermissionState | "unknown" | "unsupported"> => {
    if (!navigator.geolocation) return "unsupported";
    if (!("permissions" in navigator) || typeof navigator.permissions?.query !== "function") return "unknown";
    try {
      const permission = await navigator.permissions.query({ name: "geolocation" as PermissionName });
      return permission.state;
    } catch {
      return "unknown";
    }
  }, []);

  useEffect(() => {
    let permissionStatus: PermissionStatus | null = null;

    const syncPermissionState = async () => {
      const state = await getGeoPermissionState();
      setGeoPermissionState(state);

      if (state === "unsupported" || !("permissions" in navigator)) return;

      try {
        permissionStatus = await navigator.permissions.query({ name: "geolocation" as PermissionName });
        setGeoPermissionState(permissionStatus.state);
        permissionStatus.onchange = () => {
          setGeoPermissionState(permissionStatus?.state ?? "unknown");
        };
      } catch {
        // Browser tertentu membatasi query permission sampai ada interaksi user.
      }
    };

    syncPermissionState();

    return () => {
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, [getGeoPermissionState]);

  const getCurrentPosition = useCallback(
    () =>
      new Promise<[number, number]>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve([position.coords.latitude, position.coords.longitude]),
          (err) => reject(err),
          GEO_OPTIONS
        );
      }),
    []
  );

  const handleLocationError = (err: GeolocationPositionError) => {
    switch (err.code) {
      case err.PERMISSION_DENIED: errorToast("Izin lokasi ditolak. Klik ikon kunci di address bar browser, lalu ubah Location menjadi Allow."); break;
      case err.POSITION_UNAVAILABLE: errorToast("Lokasi tidak tersedia. Pastikan GPS aktif."); break;
      case err.TIMEOUT: errorToast("Waktu habis saat mencari lokasi."); break;
      default: errorToast("Gagal mendapatkan lokasi GPS.");
    }
  };

  const requestLocation = async (onSuccess: (pos: [number, number]) => void, setLoadingState: (v: boolean) => void) => {
    if (!navigator.geolocation) {
      setGeoPermissionState("unsupported");
      errorToast("Perangkat Anda tidak mendukung fitur GPS.");
      return;
    }

    setLoadingState(true);

    try {
      const coords = await getCurrentPosition();
      const latestPermissionState = await getGeoPermissionState();
      setGeoPermissionState(latestPermissionState === "unknown" ? "granted" : latestPermissionState);

      onSuccess(coords);
    } catch (err) {
      if (err && typeof err === "object" && "code" in err) {
        const geoErr = err as GeolocationPositionError;
        if (geoErr.code === geoErr.PERMISSION_DENIED) {
          setGeoPermissionState("denied");
        }
        handleLocationError(err as GeolocationPositionError);
      } else {
        errorToast("Gagal mendapatkan lokasi GPS.");
      }
    } finally {
      setLoadingState(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firePosition) return setError("Titik koordinat kejadian belum di-set pada peta.");
    setIsLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("fireLatitude", firePosition[0].toString());
    formData.append("fireLongitude", firePosition[1].toString());
    if (reporterPosition) {
      formData.append("reporterLatitude", reporterPosition[0].toString());
      formData.append("reporterLongitude", reporterPosition[1].toString());
    }
    formData.append("description", description);
    formData.append("address", address);
    if (file) formData.append("media", file);
    formData.append("notes", notes);
    formData.append("contact", contact);
    formData.append("categoryId", categoryId.toString());
    if (kelurahanId) formData.append("kelurahanId", kelurahanId.toString());

    try {
      const response = await fetch("/api/reports", { method: "POST", body: formData });
      if (!response.ok) {
        const data = await response.json();
        if (response.status === 401) {
          showError("Sesi Berakhir", "Sesi Anda telah berakhir.", () => router.push("/login"));
          return;
        }
        throw new Error(data.message || "Gagal mengirim laporan.");
      }

      // Langsung dialihkan (redirect) ke dashboard
      router.push("/dashboard");
    } catch (err: any) {
      errorToast(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticating) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F9FA]">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-gray-900 selection:bg-red-500/30 flex flex-col">
      {/* Top Sponsor Banner */}
      <div className="w-full bg-white border-b border-gray-200/80 z-30 flex justify-center items-center py-1.5 sm:py-2 shrink-0 relative">
        <div className="flex items-center gap-2.5 sm:gap-3.5 px-3">
          <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.15em] text-slate-500">
            Didanai Oleh:
          </span>
          <div className="bg-white px-2 py-0.5 rounded-md">
            <img src="/Logo_LPKM.png" alt="Sponsorship Logos" className="h-6 sm:h-7 md:h-8 object-contain" />
          </div>
        </div>
      </div>

      {/* Sticky Header */}
      <header className="h-14 sm:h-16 bg-white/90 backdrop-blur-xl border-b border-gray-200/80 sticky top-0 z-20 px-3 sm:px-6 lg:px-8 flex items-center justify-between shadow-2xs">
        <div className="max-w-6xl w-full mx-auto flex items-center justify-between gap-2">
          <button 
            onClick={() => router.push("/dashboard")} 
            className="h-8 px-2.5 sm:px-3 sm:h-9 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all active:scale-95 shrink-0"
            title="Kembali ke Dashboard"
          >
            <FaArrowLeft className="text-xs" /> <span className="hidden sm:inline">Dashboard</span>
          </button>
          
          <h1 className="text-xs sm:text-base md:text-lg font-bold tracking-tight text-gray-900 text-center truncate px-1">
            Buat Laporan Darurat
          </h1>
          
          <div className="shrink-0">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-200">
              <FaFire className="text-[10px]" /> <span className="hidden xs:inline">Siaga</span> 24/7
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 flex-1">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">

          {/* Kolom Kiri: Peta & Lokasi */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 sm:p-5 md:p-6 shadow-xs space-y-3.5 sm:space-y-4">
              {/* Card Section Header */}
              <div className="flex items-start gap-2.5 pb-2.5 border-b border-gray-100">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-red-50 text-red-600 font-extrabold flex items-center justify-center text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">Titik Lokasi Kejadian</h2>
                  <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">Tentukan titik kebakaran di peta atau via GPS</p>
                </div>
              </div>

              {/* Map Container */}
              <div className="rounded-xl overflow-hidden border border-gray-200 relative bg-gray-50">
                <div className="h-[280px] sm:h-[360px] md:h-[420px] w-full relative z-0">
                  <MapWithNoSSR
                    firePosition={firePosition}
                    setFirePosition={setFirePosition}
                    reporterPosition={reporterPosition}
                    setReporterPosition={setReporterPosition}
                    onNearestStationFound={setNearestStation}
                    categoryId={categoryId}
                    categoryIcon={categories.find((c) => c.id === categoryId)?.icon}
                  />
                </div>
              </div>

              {/* Location Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => requestLocation(setFirePosition, setIsGettingFireLocation)}
                  disabled={isGettingFireLocation || isGettingMyLocation}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs sm:text-sm font-bold tracking-wide text-white bg-slate-900 hover:bg-black rounded-xl transition-all shadow-2xs active:scale-95 disabled:opacity-50"
                >
                  {isGettingFireLocation ? (
                    <FaSpinner className="animate-spin text-sm" />
                  ) : (
                    <>
                      <FaCrosshairs className="text-xs text-red-400" /> Set Lokasi GPS Kejadian
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => requestLocation(setReporterPosition, setIsGettingMyLocation)}
                  disabled={isGettingMyLocation || isGettingFireLocation}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs sm:text-sm font-bold tracking-wide text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl transition-all active:scale-95 disabled:opacity-50"
                >
                  {isGettingMyLocation ? (
                    <FaSpinner className="animate-spin text-sm" />
                  ) : (
                    <>
                      <FaUser className="text-xs text-gray-400" /> Set Posisi Saya Saat Ini
                    </>
                  )}
                </button>
              </div>

              {geoPermissionState === "denied" && (
                <div className="px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                  Izin GPS browser ditolak. Mohon izinkan akses lokasi di browser untuk mendapatkan koordinat presisi.
                </div>
              )}

              {/* Koordinat Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {firePosition ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-mono">
                    <FaCheckCircle className="text-emerald-400 text-xs shrink-0" />
                    <span className="truncate">Api: {firePosition[0].toFixed(5)}, {firePosition[1].toFixed(5)}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs">
                    <FaExclamationTriangle className="text-red-500 text-xs shrink-0" />
                    <span>Titik api belum ditentukan</span>
                  </div>
                )}

                {reporterPosition && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-mono">
                    <FaCheckCircle className="text-blue-500 text-xs shrink-0" />
                    <span className="truncate">Pelapor: {reporterPosition[0].toFixed(5)}, {reporterPosition[1].toFixed(5)}</span>
                  </div>
                )}
              </div>

              <MapInstructions />
              {nearestStation && <NearestStationInfoBox info={nearestStation} />}
            </div>
          </div>

          {/* Kolom Kanan: Detail Informasi Kejadian */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-6 shadow-xs space-y-4">
              {/* Card Section Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 font-extrabold flex items-center justify-center text-xs shrink-0">
                  2
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">Detail Insiden & Bukti</h2>
                  <p className="text-[11px] sm:text-xs text-gray-500">Lengkapi data untuk mempercepat koordinasi penanganan</p>
                </div>
              </div>

              {/* Field: Kategori */}
              <div className="space-y-1">
                <label htmlFor="category" className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Jenis Insiden <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(Number(e.target.value))}
                    className="w-full appearance-none bg-slate-50/70 border border-gray-200 text-gray-900 text-xs sm:text-sm font-medium rounded-xl px-3.5 py-2.5 pr-10 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none"
                    required
                  >
                    {categories.length === 0 ? (
                      <option value="1">Darurat Umum</option>
                    ) : (
                      categories.map((category) => (
                        <option key={category.id} value={category.id}>{category.icon} {category.name}</option>
                      ))
                    )}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
                    <FaChevronDown className="text-gray-400 text-xs" />
                  </div>
                </div>
              </div>

              {/* Field: Kelurahan */}
              <div className="space-y-1">
                <label htmlFor="kelurahan" className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Wilayah / Kelurahan <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="kelurahan"
                    value={kelurahanId || ""}
                    onChange={(e) => setKelurahanId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full appearance-none bg-slate-50/70 border border-gray-200 text-gray-900 text-xs sm:text-sm font-medium rounded-xl px-3.5 py-2.5 pr-10 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none"
                    required
                  >
                    <option value="" disabled>-- Pilih Kelurahan --</option>
                    {kelurahanList.map((kel) => (
                      <option key={kel.id} value={kel.id}>{kel.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
                    <FaChevronDown className="text-gray-400 text-xs" />
                  </div>
                </div>
              </div>

              {/* Field: Alamat */}
              <div className="space-y-1">
                <label htmlFor="address" className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Jalan / Patokan Lokasi
                </label>
                <input
                  type="text"
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50/70 border border-gray-200 text-gray-900 text-xs sm:text-sm font-medium rounded-xl px-3.5 py-2.5 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none placeholder:text-gray-400"
                  placeholder="Contoh: Depan Kantor Camat Plaju / Samping SPBU"
                />
              </div>

              {/* Field: Deskripsi */}
              <div className="space-y-1">
                <label htmlFor="description" className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Rincian Situasi <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50/70 border border-gray-200 text-gray-900 text-xs sm:text-sm font-medium rounded-xl px-3.5 py-2.5 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none resize-none placeholder:text-gray-400"
                  placeholder="Jelaskan objek yang terbakar, estimasi skala api, atau kondisi di sekitar..."
                  required
                />
              </div>

              {/* Field: File Upload */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Foto / Video Kejadian (Opsional)
                </label>
                <div className="relative group">
                  <input
                    type="file"
                    id="media"
                    onChange={handleFileChange}
                    accept="image/*,video/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`w-full border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition-all ${file ? "border-slate-900 bg-slate-50" : "border-gray-200 bg-white group-hover:border-gray-300 group-hover:bg-gray-50"}`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-1.5 ${file ? "bg-slate-900 text-white" : "bg-gray-100 text-gray-400"}`}>
                      {file ? <FaCheckCircle className="text-sm" /> : <FaCloudUploadAlt className="text-base" />}
                    </div>
                    <span className="text-xs font-semibold text-gray-800 text-center truncate max-w-full px-2">
                      {file ? file.name : "Ketuk untuk upload foto/video insiden"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium flex items-center gap-2">
                  <FaExclamationTriangle className="text-red-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Action */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || !firePosition}
                  className="w-full flex items-center justify-center gap-2.5 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold py-3 sm:py-3.5 rounded-xl transition-all shadow-md active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <FaSpinner className="animate-spin text-sm" /> Mengirim Laporan...
                    </>
                  ) : (
                    <>
                      <FaFireExtinguisher className="text-sm" /> Kirim Laporan Darurat
                    </>
                  )}
                </button>
                <p className="text-center text-[10px] text-gray-400 mt-2.5">
                  Laporan darurat akan langsung diteruskan ke Pos Pemadam Kebakaran terdekat.
                </p>
              </div>
            </div>
          </div>
        </form>
      </main>

      {modal.show && (
        <Modal type={modal.type} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} onCancel={modal.onCancel} confirmText={modal.confirmText} cancelText={modal.cancelText} />
      )}
      {toast.show && <Toast type={toast.type} message={toast.message} onClose={hideToast} />}
    </div>
  );
}

```

---

## Modul 21: Antarmuka Tombol Darurat / Lapor Cepat Sekali Sentuh (Quick Panic Button)
- **Path File:** `src/app/lapor-cepat/page.tsx`
- **Jumlah Baris:** 435 baris
- **Fungsi:** Halaman pelaporan instan berkecepatan tinggi dalam kondisi kritis untuk mengirimkan sinyal darurat beserta koordinat akurat hanya dalam 1 klik.

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  FaCamera, FaMapMarkerAlt, FaExclamationTriangle,
  FaPhone, FaSpinner, FaArrowLeft, FaCheckCircle, FaUser
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Toast from "@/components/Toast";
import { useToast } from "@/hooks/useToast";

const ReportMap = dynamic(() => import("@/components/ReportMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 flex items-center justify-center rounded-2xl">
      <FaSpinner className="animate-spin text-red-500 text-3xl" />
    </div>
  ),
});

export default function LaporCepatPage() {
  const router = useRouter();
  const { toast, success, error, hideToast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [firePosition, setFirePosition] = useState<[number, number] | null>(null);
  const [reporterName, setReporterName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("1");
  const [phone, setPhone] = useState("");
  const [kelurahanId, setKelurahanId] = useState("");
  const [kelurahanList, setKelurahanList] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchKelurahan = async () => {
      try {
        const response = await fetch("/api/kelurahan");
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setKelurahanList(data.data);
            const plajuDarat = data.data.find((kel: any) => kel.name.toLowerCase().includes("plaju darat"));
            if (plajuDarat) setKelurahanId(plajuDarat.id.toString());
          }
        }
      } catch { }
    };
    fetchKelurahan();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/disaster-categories");
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setCategories(data.data);
            if (data.data.length > 0) {
              setCategoryId(data.data[0].id.toString());
            }
          }
        }
      } catch { }
    };
    fetchCategories();
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        error("Ukuran foto maksimal 5MB");
        return;
      }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const validateForm = () => {
    if (!photo) return "Mohon unggah foto kejadian darurat.";
    if (!firePosition) return "Mohon tentukan lokasi kejadian di peta.";
    if (!address.trim()) return "Mohon masukkan alamat/patokan lokasi.";
    if (!description.trim()) return "Mohon tuliskan detail kejadian.";
    if (!kelurahanId) return "Mohon pilih wilayah/kelurahan.";
    if (!reporterName.trim()) return "Mohon masukkan nama Anda.";
    if (!phone.trim()) return "Mohon masukkan nomor WhatsApp Anda.";

    const phoneRegex = /^[0-9]{10,15}$/;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      return "Nomor WhatsApp tidak valid (harus 10-15 digit angka).";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      error(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload gambar ke server
      const uploadFormData = new FormData();
      uploadFormData.append("file", photo!);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!uploadRes.ok) throw new Error("Gagal mengunggah foto");
      const uploadData = await uploadRes.json();
      const photoUrl = uploadData.url;

      // Submit laporan
      const reportFormData = new FormData();
      reportFormData.append("latitude", firePosition![0].toString());
      reportFormData.append("longitude", firePosition![1].toString());
      reportFormData.append("address", address);
      reportFormData.append("description", description);
      reportFormData.append("reporter_name", reporterName);
      reportFormData.append("category_id", categoryId);
      reportFormData.append("kelurahan_id", kelurahanId);
      reportFormData.append("phone_number", phone);
      reportFormData.append("photo_url", photoUrl);

      const reportRes = await fetch("/api/reports/guest", {
        method: "POST",
        body: reportFormData,
      });

      const reportData = await reportRes.json();

      if (!reportRes.ok) {
        throw new Error(reportData.message || "Gagal mengirim laporan");
      }

      setIsSuccess(true);
      success("Laporan darurat berhasil dikirim!");

    } catch (err: any) {
      error(err.message || "Terjadi kesalahan sistem. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <FaCheckCircle className="text-5xl text-green-500" />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Laporan Diterima!</h1>
          <p className="text-gray-500 mb-8">
            Terima kasih! Laporan darurat Anda telah diteruskan ke Operator SiagaBencana. Petugas pemadam akan segera meluncur ke lokasi dan menghubungi nomor WA Anda.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition-all"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20 font-sans">
      {toast.show && <Toast {...toast} onClose={hideToast} />}

      {/* Header */}
      <header className="bg-red-600 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-red-700 hover:bg-red-800 transition-colors"
          >
            <FaArrowLeft />
          </button>
          <div>
            <h1 className="font-bold text-lg leading-tight">Lapor Cepat Darurat</h1>
            <p className="text-[10px] text-red-200 uppercase tracking-widest font-semibold">Pelaporan Cepat Tanpa Login</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6 flex gap-3">
          <FaExclamationTriangle className="text-yellow-600 text-xl shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800 leading-relaxed font-medium">
            Formulir ini khusus untuk <strong className="text-red-600">Keadaan Darurat Asli</strong>. Dilarang memberikan laporan palsu (Prank). Sistem mencatat data perangkat Anda.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Section 1: Foto */}
          <section className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs">1</span>
              Foto Kejadian <span className="text-red-500">*</span>
            </h2>

            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              ref={fileInputRef}
              onChange={handlePhotoChange}
            />

            {!photoPreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="h-40 rounded-2xl border-2 border-dashed border-gray-300 hover:border-red-400 bg-gray-50 flex flex-col items-center justify-center cursor-pointer transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <FaCamera className="text-xl" />
                </div>
                <p className="font-semibold text-gray-700">Ambil Foto Kejadian</p>
                <p className="text-xs text-gray-400 mt-1">Gunakan kamera langsung atau dari galeri</p>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-black h-48 sm:h-64">
                <Image src={photoPreview} alt="Preview" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                  className="absolute top-3 right-3 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors"
                >
                  <FaArrowLeft className="rotate-45" />
                </button>
              </div>
            )}
          </section>

          {/* Section 2: Lokasi */}
          <section className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-base font-bold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs">2</span>
              Lokasi Api <span className="text-red-500">*</span>
            </h2>

            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  if ('geolocation' in navigator) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => setFirePosition([pos.coords.latitude, pos.coords.longitude]),
                      (err) => alert("Gagal mendapatkan lokasi. Pastikan GPS aktif.")
                    );
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold tracking-wide uppercase text-white bg-gray-900 hover:bg-black rounded-xl transition-all shadow-sm active:scale-95"
              >
                <FaMapMarkerAlt /> Gunakan GPS
              </button>
            </div>

            <div className="relative z-0 h-[350px] md:h-[450px] w-full rounded-2xl overflow-hidden ring-1 ring-gray-200">
              <ReportMap
                firePosition={firePosition}
                setFirePosition={setFirePosition}
                categoryId={parseInt(categoryId, 10)}
                categoryIcon={categories.find(c => c.id.toString() === categoryId)?.icon}
              />
            </div>
            {firePosition && (
              <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 flex gap-3 items-start">
                <FaMapMarkerAlt className="text-red-500 mt-1 shrink-0" />
                <p className="text-sm font-medium text-gray-700 leading-relaxed">
                  Lokasi Terpilih: {firePosition[0].toFixed(5)}, {firePosition[1].toFixed(5)}
                </p>
              </div>
            )}
          </section>

          {/* Section 3: Detail */}
          <section className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-5">
            <h2 className="text-base font-bold mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs">3</span>
              Detail Laporan <span className="text-red-500">*</span>
            </h2>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Kategori Kejadian</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm font-medium text-gray-900 transition-all"
                required
              >
                {categories.length === 0 ? (
                  <option value="1">🔥 Kebakaran lingkungan & lahan kecil</option>
                ) : (
                  categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Wilayah / Kelurahan</label>
              <select
                value={kelurahanId}
                onChange={(e) => setKelurahanId(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm font-medium text-gray-900 transition-all"
                required
              >
                <option value="" disabled>-- Pilih Kelurahan --</option>
                {kelurahanList.map((kel) => (
                  <option key={kel.id} value={kel.id}>{kel.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Jalan / Patokan Lokasi</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Misal: Dekat gapura masuk / sebelah pos ronda"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm font-medium text-gray-900 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Ceritakan Situasinya</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Misal: Api mulai membesar di lahan kosong belakang sekolah..."
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm font-medium text-gray-900 transition-all resize-none"
              />
            </div>
          </section>

          {/* Section 4: Kontak */}
          <section className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-base font-bold mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs">4</span>
              Kontak & Identitas <span className="text-red-500">*</span>
            </h2>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Petugas butuh identitas dan nomor Anda untuk mengonfirmasi rute dan lokasi persis secara cepat.
            </p>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Panggilan / Lengkap</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaUser className="text-gray-400 text-sm" />
                </div>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="Contoh: Pak Budi"
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm font-bold text-gray-900 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Nomor WhatsApp Aktif</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaPhone className="text-gray-400 text-sm" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Contoh: 081234567890"
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm font-bold text-gray-900 transition-all"
                  required
                />
              </div>
            </div>
          </section>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-red-500/30 transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="animate-spin text-xl" />
                <span>MENGIRIM LAPORAN...</span>
              </>
            ) : (
              <span>KIRIM LAPORAN SEKARANG</span>
            )}
          </button>

        </form>
      </main>
    </div>
  );
}

```

---
