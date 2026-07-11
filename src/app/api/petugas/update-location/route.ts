import { NextRequest } from "next/server";
import { execute } from "@/lib/db";
import { getAuthPayloadFromRequest, handleCorsOptions, jsonWithCors } from "@/lib/cors";

export async function OPTIONS() {
  return handleCorsOptions();
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthPayloadFromRequest(request);

    if (user.role !== 'petugas') {
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

    return jsonWithCors({ success: true, message: "Lokasi berhasil diperbarui." }, { status: 200, request });

  } catch (error: any) {
    if (error.message?.includes("autentikasi") || error.message?.includes("Token")) {
      return jsonWithCors({ message: "Akses ditolak. Silakan login kembali." }, { status: 401, request });
    }
    console.error("Update Location Error:", error);
    return jsonWithCors({ message: "Terjadi kesalahan server internal." }, { status: 500, request });
  }
}
