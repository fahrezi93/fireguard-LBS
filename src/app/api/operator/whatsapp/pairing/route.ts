import { NextRequest, NextResponse } from "next/server";
import { getAuthPayloadFromRequest, jsonWithCors } from "@/lib/cors";

export async function POST(request: NextRequest) {
  try {
    // 1. Validasi Autentikasi (hanya SUPER_ADMIN atau OPERATOR yang boleh mengakses)
    const user = await getAuthPayloadFromRequest(request);
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "OPERATOR")) {
      return jsonWithCors(
        { success: false, message: "Akses ditolak. Anda tidak memiliki izin." },
        { status: 403, request }
      );
    }

    // 2. Ambil data dari body
    const body = await request.json();
    const { phoneNumber } = body;

    if (!phoneNumber) {
      return jsonWithCors(
        { success: false, message: "Nomor HP (phoneNumber) wajib diisi." },
        { status: 400, request }
      );
    }

    // 3. Teruskan ke wa-server
    const WA_SERVER_URL = process.env.WA_SERVER_URL || "http://localhost:3001";
    const res = await fetch(`${WA_SERVER_URL}/api/pairing`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phoneNumber }),
    });

    const data = await res.json();
    return jsonWithCors(data, { status: res.status, request });
  } catch (error: any) {
    console.error("Error in whatsapp/pairing API:", error);
    return jsonWithCors(
      { success: false, message: "Gagal terhubung ke wa-server." },
      { status: 500, request }
    );
  }
}
