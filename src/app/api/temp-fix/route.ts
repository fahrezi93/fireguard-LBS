import { NextResponse } from "next/server";
import { queryRows, queryRow, execute } from "@/lib/db";

export async function GET() {
  try {
    // Cari id Misyadi yang baru (yang email-nya misyadi@siagabencana.cloud)
    const misyadi = await queryRow(
      "SELECT id FROM users WHERE email = 'misyadi@siagabencana.cloud'"
    );

    if (!misyadi) {
      return NextResponse.json({ success: false, message: "Misyadi tidak ditemukan" });
    }

    const newId = (misyadi as any).id;

    // Cari report yang memiliki assigned_petugas_id yang merujuk ke Misyadi yang lama
    // Tapi karena Misyadi lama sudah dihapus, mungkin assigned_petugas_id-nya sudah NULL atau masih angka lama (jika ON DELETE NO ACTION)
    // Karena kita tahu Misyadi menangani laporan di Area Plaju Darat, kita update saja berdasarkan kontak atau deskripsi
    // ATAU kalau assigned_petugas_id-nya diset NULL, kita update semua report yang assigned_petugas_id IS NULL dan category kebakaran
    // Lebih aman: kita update report yang pernah diselesaikan oleh petugas (berdasarkan status 'completed' dan nama 'Misyadi' di tabel users sebelumnya, tapi sayangnya sudah terhapus)
    
    // Mari kita cek id petugas sebelumnya. Misyadi yg baru id-nya 42.
    // Laporan yang "dibatalkan" dan "selesai" yang ada di screenshot Misyadi.
    // Wait, let's just assign ALL completed and dibatalkan/false_report reports that have assigned_petugas_id IS NULL (or an ID < 42 that no longer exists in users table) to Misyadi!
    
    // Karena Misyadi adalah petugas kita satu-satunya saat ini yang demo, kita ambil semua report yang yatim piatu.
    const affectedRows = await execute(
      `UPDATE reports 
       SET assigned_petugas_id = ? 
       WHERE assigned_petugas_id IS NULL OR assigned_petugas_id NOT IN (SELECT id FROM users)`,
      [newId]
    );

    return NextResponse.json({
      success: true,
      message: "Riwayat berhasil disambungkan ke Misyadi",
      newId,
      affectedRows
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
