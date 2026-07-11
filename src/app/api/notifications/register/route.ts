import { NextRequest } from "next/server";
import { execute, formatDateForMySQL } from "@/lib/db";
import {
  getAuthPayloadFromRequest,
  handleCorsOptions,
  jsonWithCors,
} from "@/lib/cors";
import { enforceRateLimit } from "@/lib/rate-limit";
import { ensureNotificationTables } from "@/lib/db-init";

// OPTIONS: CORS preflight
export async function OPTIONS() {
  return handleCorsOptions();
}

/**
 * POST /api/notifications/register
 * Register or update a device token for push notifications
 *
 * Request Body:
 * {
 *   deviceToken: string;
 *   platform?: 'android' | 'ios';
 * }
 *
 * Requirements: 1.3, 1.4, 7.5
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const limit = enforceRateLimit(
      request,
      "notifications-register",
      10,
      60_000,
    );
    if (!limit.allowed) {
      return jsonWithCors(
        { message: "Terlalu banyak permintaan. Coba lagi nanti." },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfter) },
          request,
        },
      );
    }

    // Validate JWT authentication and extract user ID
    const user = await getAuthPayloadFromRequest(request);
    const userId = user.id;

    // Parse request body
    const body = await request.json();
    const { deviceToken, platform } = body;

    // Validate device token format
    if (
      !deviceToken ||
      typeof deviceToken !== "string" ||
      deviceToken.trim().length === 0
    ) {
      return jsonWithCors(
        { message: "Device token tidak valid." },
        { status: 400, request },
      );
    }

    // Validate platform if provided
    if (platform && platform !== "android" && platform !== "ios") {
      return jsonWithCors(
        { message: "Platform harus 'android' atau 'ios'." },
        { status: 400, request },
      );
    }

    // Pastikan tabel device_tokens sudah ada
    await ensureNotificationTables();

    const currentTimestamp = formatDateForMySQL(new Date());
    const platformValue = platform || "android"; // Default to android if not specified

    // Menonaktifkan token lama milik user yang sama agar tidak menumpuk saat reinstall
    await execute(
      "UPDATE device_tokens SET is_active = FALSE WHERE user_id = ? AND device_token != ?",
      [userId, deviceToken.trim()]
    );

    // Insert or update device token (upsert pattern)
    // If device_token already exists, update is_active to TRUE and update timestamps
    await execute(
      `INSERT INTO device_tokens (user_id, device_token, platform, is_active, created_at, updated_at, last_used_at)
       VALUES (?, ?, ?, TRUE, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         user_id = VALUES(user_id),
         platform = VALUES(platform),
         is_active = TRUE,
         updated_at = VALUES(updated_at),
         last_used_at = VALUES(last_used_at)`,
      [
        userId,
        deviceToken.trim(),
        platformValue,
        currentTimestamp,
        currentTimestamp,
        currentTimestamp,
      ],
    );

    return jsonWithCors(
      {
        success: true,
        message: "Device token berhasil didaftarkan.",
      },
      { status: 200, request },
    );
  } catch (error: any) {
    console.error("Error in device token registration:", error);

    // Handle authentication errors
    if (
      error.message?.includes("autentikasi") ||
      error.message?.includes("Token")
    ) {
      return jsonWithCors(
        { success: false, message: "Autentikasi gagal. Silakan login ulang." },
        { status: 401, request },
      );
    }

    // Handle database errors
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return jsonWithCors(
        { success: false, message: "User tidak ditemukan." },
        { status: 404, request },
      );
    }

    return jsonWithCors(
      {
        success: false,
        message: "Terjadi kesalahan pada server.",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500, request },
    );
  }
}
