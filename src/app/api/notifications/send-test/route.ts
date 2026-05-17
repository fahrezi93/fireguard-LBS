/**
 * POST /api/notifications/send-test
 *
 * Endpoint untuk test kirim push notification FCM ke device yang sedang login.
 * Berguna untuk memverifikasi bahwa:
 *   1. Firebase Admin SDK berhasil diinisialisasi
 *   2. FCM token user terdaftar di database
 *   3. Notifikasi berhasil dikirim ke HP
 *
 * Hanya bisa diakses oleh user yang sudah login.
 */

import { NextRequest } from "next/server";
import { queryRows } from "@/lib/db";
import { getAuthPayloadFromRequest, handleCorsOptions, jsonWithCors } from "@/lib/cors";
import { getMessaging } from "@/lib/firebase-admin";
import { ensureNotificationTables } from "@/lib/db-init";

export async function OPTIONS() {
  return handleCorsOptions();
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthPayloadFromRequest(request);

    // Pastikan tabel ada
    await ensureNotificationTables();

    // Cek apakah Firebase Admin terinisialisasi
    const messaging = getMessaging();
    const firebaseReady = messaging !== null;

    // Ambil semua token aktif user ini
    const tokens = await queryRows<{ device_token: string; platform: string }>(
      `SELECT device_token, platform
       FROM device_tokens
       WHERE user_id = ?
         AND is_active = TRUE
         AND platform IN (?, ?)`,
      [user.id, "android", "ios"]
    );

    if (!firebaseReady) {
      return jsonWithCors({
        success: false,
        message: "Firebase Admin SDK BELUM diinisialisasi!",
        hint: "Pastikan FIREBASE_SERVICE_ACCOUNT_KEY sudah di-set di .env VPS lalu restart PM2 (pm2 reload fireguard-web).",
        firebase_ready: false,
        tokens_registered: tokens.length,
        tokens,
      }, { status: 503, request });
    }

    if (tokens.length === 0) {
      return jsonWithCors({
        success: false,
        message: "Tidak ada device token mobile terdaftar untuk user ini.",
        hint: "Pastikan app Flutter sudah di-rebuild dan user sudah login ulang setelah update terbaru.",
        firebase_ready: true,
        tokens_registered: 0,
      }, { status: 404, request });
    }

    // Kirim test notification ke semua device token user
    const results: { token: string; platform: string; success: boolean; error?: string }[] = [];

    for (const { device_token, platform } of tokens) {
      try {
        await messaging!.send({
          token: device_token,
          notification: {
            title: "Test Notifikasi FireGuard",
            body: "Notifikasi berhasil! FCM berjalan dengan baik.",
          },
          data: {
            type: "test",
            reportId: "0",
            status: "test",
            target: "mobile",
          },
          android: {
            priority: "high",
            notification: {
              channelId: "fireguard_reports",
              priority: "high",
              sound: "default",
              defaultSound: true,
              defaultVibrateTimings: true,
            },
          },
        });
        results.push({ token: device_token.substring(0, 20) + "...", platform, success: true });
      } catch (err: any) {
        results.push({
          token: device_token.substring(0, 20) + "...",
          platform,
          success: false,
          error: err?.message ?? "Unknown error",
        });
      }
    }

    const anySuccess = results.some((r) => r.success);

    return jsonWithCors({
      success: anySuccess,
      message: anySuccess
        ? `Test notification terkirim ke ${results.filter(r => r.success).length} dari ${results.length} device!`
        : "Semua pengiriman gagal. Lihat detail error.",
      firebase_ready: true,
      tokens_registered: tokens.length,
      results,
    }, { status: 200, request });
  } catch (error: any) {
    if (error.message?.includes("autentikasi") || error.message?.includes("Token")) {
      return jsonWithCors({ message: "Akses ditolak." }, { status: 401, request });
    }
    return jsonWithCors({
      success: false,
      message: "Terjadi kesalahan.",
      error: error?.message,
    }, { status: 500, request });
  }
}
