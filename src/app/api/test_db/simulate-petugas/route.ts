import { NextRequest } from "next/server";
import { jsonWithCors } from "@/lib/cors";

export async function POST(request: NextRequest) {
  try {
    const { petugasId, lat, lng } = await request.json();

    if (!petugasId || lat === undefined || lng === undefined) {
      return jsonWithCors({ message: "petugasId, lat, dan lng wajib diisi" }, { status: 400, request });
    }

    const { execute } = await import("@/lib/db");
    await execute(
      "UPDATE users SET last_latitude = ?, last_longitude = ?, last_location_update = NOW() WHERE id = ?",
      [lat, lng, petugasId]
    );

    const wss = global.wss;
    if (wss) {
      wss.broadcast(
        JSON.stringify({
          type: "PETUGAS_LOCATION_UPDATE",
          payload: { petugasId: Number(petugasId), lat, lng },
        })
      );
      return jsonWithCors({ success: true, message: "Simulasi update lokasi terkirim" }, { status: 200, request });
    }

    return jsonWithCors({ message: "WebSocket server tidak aktif" }, { status: 500, request });
  } catch (error) {
    return jsonWithCors({ message: "Error" }, { status: 500, request });
  }
}
