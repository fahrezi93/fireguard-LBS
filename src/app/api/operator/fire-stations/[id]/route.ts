import { NextRequest, NextResponse } from "next/server";
import { queryRow, execute } from "@/lib/db";
import { requireOperator } from "@/lib/api-security";

// PUT: Update fire station
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireOperator(request);
    if ("response" in auth) return auth.response;

    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "ID tidak valid" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, address, latitude, longitude, contact_phone, status, kelurahan_id } = body;

    if (!name || !latitude || !longitude) {
      return NextResponse.json(
        { success: false, message: "Nama, latitude, dan longitude wajib diisi" },
        { status: 400 }
      );
    }

    try {
      const existing = await queryRow(
        "SELECT id FROM fire_stations WHERE id = ?",
        [id]
      );

      if (!existing) {
        return NextResponse.json(
          { success: false, message: "Pos pemadam tidak ditemukan" },
          { status: 404 }
        );
      }

      await execute(
        `UPDATE fire_stations SET name = ?, address = ?, latitude = ?, longitude = ?,
         contact_phone = ?, status = ?, kelurahan_id = ? WHERE id = ?`,
        [
          name,
          address ?? null,
          parseFloat(latitude),
          parseFloat(longitude),
          contact_phone ?? null,
          status ?? "aktif",
          kelurahan_id ?? null,
          id,
        ]
      );

      return NextResponse.json({
        success: true,
        message: "Pos pemadam berhasil diperbarui",
      });
    } catch {
      return NextResponse.json(
        { success: false, message: "Tabel fire_stations belum tersedia di database" },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Error updating fire station:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui pos pemadam" },
      { status: 500 }
    );
  }
}

// DELETE: Delete fire station
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireOperator(request);
    if ("response" in auth) return auth.response;

    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "ID tidak valid" },
        { status: 400 }
      );
    }

    try {
      const existing = await queryRow(
        "SELECT id FROM fire_stations WHERE id = ?",
        [id]
      );

      if (!existing) {
        return NextResponse.json(
          { success: false, message: "Pos pemadam tidak ditemukan" },
          { status: 404 }
        );
      }

      await execute("DELETE FROM fire_stations WHERE id = ?", [id]);

      return NextResponse.json({
        success: true,
        message: "Pos pemadam berhasil dihapus",
      });
    } catch {
      return NextResponse.json(
        { success: false, message: "Tabel fire_stations belum tersedia di database" },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Error deleting fire station:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus pos pemadam" },
      { status: 500 }
    );
  }
}
