import { NextResponse } from "next/server";
import { queryRows } from "@/lib/db";

export async function GET() {
  try {
    const petugas = await queryRows("SELECT id, name, email, is_on_duty FROM users WHERE role = 'petugas'");
    const reports = await queryRows("SELECT status, assigned_petugas_id, COUNT(*) as count FROM reports GROUP BY status, assigned_petugas_id");
    
    return NextResponse.json({
      petugas,
      reports
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
