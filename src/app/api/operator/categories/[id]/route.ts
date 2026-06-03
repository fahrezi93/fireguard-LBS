import { NextRequest, NextResponse } from "next/server";
import { queryRow, execute } from "@/lib/db";
import { requireOperator } from "@/lib/api-security";

// PUT: Update disaster category
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
    const { name, icon, color, description } = body;

    if (!name || !icon || !color) {
      return NextResponse.json(
        { success: false, message: "Nama, ikon, dan warna wajib diisi" },
        { status: 400 }
      );
    }

    const existing = await queryRow(
      "SELECT id FROM disaster_categories WHERE id = ?",
      [id]
    );

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Kategori tidak ditemukan" },
        { status: 404 }
      );
    }

    await execute(
      "UPDATE disaster_categories SET name = ?, icon = ?, color = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [name, icon, color, description ?? null, id]
    );

    return NextResponse.json({
      success: true,
      message: "Kategori berhasil diperbarui",
    });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui kategori" },
      { status: 500 }
    );
  }
}

// DELETE: Delete disaster category
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

    const existing = await queryRow(
      "SELECT id, name FROM disaster_categories WHERE id = ?",
      [id]
    );

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Kategori tidak ditemukan" },
        { status: 404 }
      );
    }

    // Cek apakah kategori digunakan oleh laporan
    const inUse = await queryRow<{ count: number }>(
      "SELECT COUNT(*) as count FROM reports WHERE category_id = ?",
      [id]
    );

    if (inUse && inUse.count > 0) {
      // Soft delete — nonaktifkan saja
      await execute(
        "UPDATE disaster_categories SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [id]
      );
      return NextResponse.json({
        success: true,
        message: `Kategori dinonaktifkan (digunakan oleh ${inUse.count} laporan)`,
      });
    }

    // Hard delete
    await execute("DELETE FROM disaster_categories WHERE id = ?", [id]);

    return NextResponse.json({
      success: true,
      message: "Kategori berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus kategori" },
      { status: 500 }
    );
  }
}
