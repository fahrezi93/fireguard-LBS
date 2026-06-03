import { NextRequest, NextResponse } from "next/server";
import { queryRow, execute, executeAndGetLastInsertId, queryRows } from "@/lib/db";
import { requireOperator } from "@/lib/api-security";
import { fireStations } from "@/lib/fire-stations";

// GET: Fetch all fire stations
export async function GET(request: NextRequest) {
  try {
    const auth = await requireOperator(request);
    if ("response" in auth) return auth.response;

    try {
      const stations = await queryRows(
        "SELECT * FROM fire_stations ORDER BY name ASC"
      );
      if (stations && (stations as any[]).length > 0) {
        return NextResponse.json({ success: true, data: stations });
      }
    } catch {
      // Table might not exist, fall through to static data
    }

    // Fallback to static data
    const staticData = fireStations.map((s, i) => ({
      id: i + 1,
      name: s.name,
      address: s.address,
      latitude: s.latitude,
      longitude: s.longitude,
      contact_phone: s.phone ?? null,
      status: "aktif" as const,
      kelurahan_id: null,
      equipment_details: null,
    }));

    return NextResponse.json({ success: true, data: staticData });
  } catch (error) {
    console.error("Error fetching fire stations:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data pos pemadam" },
      { status: 500 }
    );
  }
}

// POST: Create new fire station
export async function POST(request: NextRequest) {
  try {
    const auth = await requireOperator(request);
    if ("response" in auth) return auth.response;

    const body = await request.json();
    const { name, address, latitude, longitude, contact_phone, status, kelurahan_id } = body;

    if (!name || !latitude || !longitude) {
      return NextResponse.json(
        { success: false, message: "Nama, latitude, dan longitude wajib diisi" },
        { status: 400 }
      );
    }

    try {
      const id = await executeAndGetLastInsertId(
        `INSERT INTO fire_stations (name, address, latitude, longitude, contact_phone, status, kelurahan_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          address ?? null,
          parseFloat(latitude),
          parseFloat(longitude),
          contact_phone ?? null,
          status ?? "aktif",
          kelurahan_id ?? null,
        ]
      );

      return NextResponse.json(
        {
          success: true,
          message: "Pos pemadam berhasil ditambahkan",
          data: { id, name, address, latitude, longitude, contact_phone, status },
        },
        { status: 201 }
      );
    } catch {
      // Table doesn't exist — return informative error
      return NextResponse.json(
        { success: false, message: "Tabel fire_stations belum tersedia di database" },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Error creating fire station:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menambahkan pos pemadam" },
      { status: 500 }
    );
  }
}
