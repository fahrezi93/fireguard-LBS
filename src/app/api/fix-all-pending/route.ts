import { NextResponse } from "next/server";
import { execute } from "@/lib/db";

export async function GET() {
  try {
    const affectedRows = await execute(
      "UPDATE reports SET assigned_petugas_id = NULL WHERE status NOT IN ('in_progress', 'completed', 'false_report', 'dibatalkan', 'ditangani', 'arrived')"
    );

    return NextResponse.json({
      success: true,
      message: "Semua laporan berstatus BARU (pending) berhasil di-reset agar tidak assigned ke siapapun.",
      affectedRows
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
