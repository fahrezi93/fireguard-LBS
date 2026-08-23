import { NextResponse } from "next/server";
import { execute } from "@/lib/db";

export async function GET() {
  try {
    const affectedRows = await execute(
      "UPDATE reports SET assigned_petugas_id = NULL WHERE id = 63 AND status = 'pending'"
    );

    return NextResponse.json({
      success: true,
      message: "Laporan 63 berhasil di-reset agar tidak assigned ke Misyadi.",
      affectedRows
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
