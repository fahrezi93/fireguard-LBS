import { NextResponse } from "next/server";

export async function GET() {
  // In production, you might want to fetch this from a database or a config file
  const latestVersion = {
    version: "1.0.1", // version name
    buildNumber: "2",  // version code
    downloadUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/downloads/fireguard-latest.apk`,
    forceUpdate: false,
    changelog: "• Penambahan fitur update otomatis\n• Perbaikan UI pada dashboard\n• Optimasi notifikasi",
  };

  return NextResponse.json(latestVersion);
}
