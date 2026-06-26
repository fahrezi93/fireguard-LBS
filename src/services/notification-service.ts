/**
 * Notification Service
 *
 * Provides notification content generation for report status changes.
 * Implements Indonesian language notification messages for all status types.
 * Handles FCM notification sending with retry logic and error handling.
 */

import { getMessaging } from "@/lib/firebase-admin";
import { execute, queryRows, formatDateForMySQL } from "@/lib/db";
import { ensureNotificationTables } from "@/lib/db-init";

interface NotificationContent {
  title: string;
  body: string;
}

interface NotificationPayload {
  title: string;
  body: string;
  data: {
    reportId: string;
    status: string;
    type: string;
    target?: string;
    notificationId?: string;
  };
}

interface DeviceToken {
  device_token: string;
  platform: string;
}

interface NotificationPreferences {
  approved: boolean | number;
  in_progress: boolean | number;
  completed: boolean | number;
  verified: boolean | number;
  false_report: boolean | number;
}

const STATUS_CANONICAL_MAP: Record<string, string> = {
  approved: "approved",
  in_progress: "in_progress",
  completed: "completed",
  verified: "verified",
  false_report: "false_report",
  diproses: "in_progress",
  ditangani: "in_progress",
  dispatched: "in_progress",
  dikirim: "in_progress",
  arrived: "in_progress",
  selesai: "completed",
  false: "false_report",
};

const STATUS_TO_PREFERENCE_KEY: Record<string, keyof NotificationPreferences> =
{
  approved: "approved",
  in_progress: "in_progress",
  completed: "completed",
  verified: "verified",
  false_report: "false_report",
};

const MOBILE_PLATFORMS = ["android", "ios"];
const ANDROID_NOTIFICATION_CHANNEL_ID = "siagabencana_reports";

export function normalizeNotificationStatus(status: string): string {
  const normalized = status.trim().toLowerCase();
  return STATUS_CANONICAL_MAP[normalized] || normalized;
}

function isPreferenceEnabled(value: boolean | number | undefined): boolean {
  return value === undefined || value === true || value === 1;
}

/**
 * Get localized notification content for a given report status
 *
 * @param status - The report status (approved, in_progress, completed, verified, false_report)
 * @returns Notification content with title and body in Indonesian
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */
export function getNotificationContent(status: string): NotificationContent {
  switch (status) {
    case "approved":
      return {
        title: "Laporan Disetujui",
        body: "Laporan Anda telah disetujui dan sedang diproses",
      };

    case "in_progress":
      return {
        title: "Laporan Sedang Ditangani",
        body: "Petugas sedang menangani laporan Anda",
      };

    case "completed":
      return {
        title: "Laporan Selesai",
        body: "Laporan Anda telah diselesaikan",
      };

    case "verified":
      return {
        title: "Laporan Terverifikasi",
        body: "Laporan Anda telah diverifikasi oleh petugas",
      };

    case "false_report":
      return {
        title: "Laporan Ditolak",
        body: "Laporan Anda ditandai sebagai laporan palsu",
      };

    default:
      return {
        title: "Pembaruan Laporan",
        body: "Status laporan Anda telah diperbarui",
      };
  }
}

/**
 * Send notification to a single device via FCM
 *
 * @param deviceToken - The FCM device token to send notification to
 * @param payload - The notification payload containing title, body, and data
 * @returns Promise<boolean> - true if notification was sent successfully, false otherwise
 *
 * Requirements: 5.1
 */
export async function sendToDevice(
  deviceToken: string,
  payload: NotificationPayload,
): Promise<boolean> {
  try {
    const message = {
      token: deviceToken,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        ...payload.data,
        title: payload.title,
        body: payload.body,
      },
      android: {
        priority: "high" as const,
        notification: {
          channelId: ANDROID_NOTIFICATION_CHANNEL_ID,
          priority: "high" as const,
          sound: "default",
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
      apns: {
        headers: {
          "apns-priority": "10",
        },
        payload: {
          aps: {
            sound: "default",
            badge: 1,
            contentAvailable: true,
          },
        },
      },
    };

    const messaging = getMessaging();
    if (!messaging) {
      console.warn(
        "Firebase Messaging not initialized. Cannot send notification.",
      );
      return false;
    }
    await messaging.send(message);
    return true;
  } catch (error: any) {
    await handleFCMError(error, deviceToken);
    return false;
  }
}

/**
 * Retry a function with exponential backoff
 *
 * @param fn - The async function to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param baseDelay - Base delay in milliseconds (default: 1000ms)
 * @returns Promise<boolean> - true if function succeeded, false if all retries failed
 *
 * Requirements: 5.1
 */
export async function retryWithBackoff(
  fn: () => Promise<boolean>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<boolean> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await fn();
      if (result) {
        return true;
      }
      // If result is false, treat it as a failure and retry
      lastError = new Error("Function returned false");
    } catch (error) {
      lastError = error as Error;
    }

    // Don't delay after the last attempt
    if (attempt < maxRetries - 1) {
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(
        `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  console.error(`All ${maxRetries} retry attempts failed:`, lastError?.message);
  return false;
}

/**
 * Handle FCM error responses and take appropriate action
 *
 * @param error - The error object from FCM
 * @param deviceToken - The device token that caused the error
 *
 * Requirements: 5.2, 5.3, 10.1
 */
export async function handleFCMError(
  error: any,
  deviceToken: string,
): Promise<void> {
  const errorCode = error?.code || error?.errorInfo?.code || "unknown";
  const errorMessage = error?.message || "Unknown error";

  console.error(
    `FCM error for token ${deviceToken}: ${errorCode} - ${errorMessage}`,
  );

  switch (errorCode) {
    case "messaging/invalid-registration-token":
    case "messaging/registration-token-not-registered":
      // Mark token as inactive in database (Requirement 5.2)
      try {
        await execute(
          "UPDATE device_tokens SET is_active = FALSE, updated_at = NOW() WHERE device_token = ?",
          [deviceToken],
        );
        console.warn(`Marked invalid token as inactive: ${deviceToken}`);
      } catch (dbError) {
        console.error("Failed to mark token as inactive:", dbError);
      }
      break;

    case "messaging/message-rate-exceeded":
      // Rate limit error - will be handled by retry logic (Requirement 5.3)
      console.warn("FCM rate limit exceeded, will retry with backoff");
      throw new Error("Rate limit exceeded");

    case "messaging/server-unavailable":
    case "messaging/internal-error":
      // Server unavailable - will be handled by retry logic (Requirement 5.3)
      console.warn("FCM server unavailable, will retry with backoff");
      throw new Error("FCM server unavailable");

    default:
      // Log unknown errors (Requirement 10.1)
      console.error(`Unhandled FCM error: ${errorCode} - ${errorMessage}`);
      throw error;
  }
}

/**
 * Send report status notification to user
 *
 * Main orchestration method that handles the complete notification flow:
 * 1. Query user's active device tokens
 * 2. Check user's notification preferences
 * 3. Generate notification content
 * 4. Send to each device with retry logic
 * 5. Log all attempts to notification_logs table
 *
 * @param reportId - The ID of the report that changed status
 * @param userId - The ID of the user who owns the report
 * @param newStatus - The new status of the report
 * @param notificationId - Optional. The ID dari row di tabel `notifications` (jika sudah dibuat).
 *   Disertakan di FCM data payload agar mobile bisa pakai ID yang sama untuk
 *   dedup, mark-read, dan delete (sync ke backend).
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 5.4, 6.5
 */
export async function sendReportStatusNotification(
  reportId: number,
  userId: number,
  newStatus: string,
  notificationId?: number,
): Promise<void> {
  try {
    const canonicalStatus = normalizeNotificationStatus(newStatus);

    // Pastikan semua tabel notification sudah ada sebelum query
    await ensureNotificationTables();

    // Step 1: Query user's active device tokens (Requirement 2.1)
    const deviceTokens = await queryRows<DeviceToken>(
      `SELECT device_token, platform
       FROM device_tokens
       WHERE user_id = ?
         AND is_active = TRUE
         AND platform IN (?, ?)`,
      [userId, ...MOBILE_PLATFORMS],
    );

    if (deviceTokens.length === 0) {
      console.warn(
        `[Notification] No active mobile device tokens for user ${userId}. ` +
        `Make sure the user logged in after the FCM fix was deployed.`,
      );
      return;
    }

    console.info(
      `[Notification] Found ${deviceTokens.length} mobile device token(s) for user ${userId}`,
    );

    // Step 2: Check user's notification preferences (Requirement 6.5)
    // Dibungkus try-catch sendiri agar preferensi yang tidak ada tidak menghentikan notifikasi
    let preferences: NotificationPreferences[] = [];
    try {
      preferences = await queryRows<NotificationPreferences>(
        "SELECT approved, in_progress, completed, verified, false_report FROM notification_preferences WHERE user_id = ?",
        [userId],
      );
    } catch (prefError: any) {
      console.warn(
        `[Notification] Could not read preferences for user ${userId}: ${prefError?.message}. Defaulting to all enabled.`,
      );
    }

    // If no preferences found, default to all enabled
    const userPrefs = preferences[0] || {
      approved: true,
      in_progress: true,
      completed: true,
      verified: true,
      false_report: true,
    };

    // Check if user wants this notification type
    const preferenceKey = STATUS_TO_PREFERENCE_KEY[canonicalStatus];
    if (preferenceKey && !isPreferenceEnabled(userPrefs[preferenceKey])) {
      console.info(
        `User ${userId} has disabled notifications for status: ${canonicalStatus}`,
      );
      return;
    }

    // Step 3: Generate notification content (Requirement 2.6)
    const content = getNotificationContent(canonicalStatus);
    const payload: NotificationPayload = {
      title: content.title,
      body: content.body,
      data: {
        reportId: reportId.toString(),
        status: canonicalStatus,
        type: "report_status_change",
        target: "mobile",
        // Sertakan notificationId agar mobile bisa pakai ID yang sama
        // untuk dedup, mark-read, dan delete sync ke backend.
        ...(notificationId !== undefined ? { notificationId: notificationId.toString() } : {}),
      },
    };

    // Step 4: Send notification to each device token (Requirement 2.1, 5.1)
    const currentTimestamp = new Date();

    for (const token of deviceTokens) {
      let deliveryStatus: "sent" | "failed" | "retry" = "failed";
      let errorMessage: string | null = null;
      let retryCount = 0;

      try {
        // Send with retry logic (Requirement 5.1)
        const success = await retryWithBackoff(
          async () => sendToDevice(token.device_token, payload),
          3,
          1000,
        );

        if (success) {
          deliveryStatus = "sent";
        } else {
          deliveryStatus = "failed";
          errorMessage = "All retry attempts failed";
          retryCount = 3;
        }
      } catch (error: any) {
        deliveryStatus = "failed";
        errorMessage = error?.message || "Unknown error";
        console.error(
          `Failed to send notification to token ${token.device_token}:`,
          error,
        );
      }

      // Step 5: Log notification attempt (Requirement 2.7)
      try {
        await execute(
          `INSERT INTO notification_logs
           (report_id, user_id, device_token, status_change, title, body, delivery_status, error_message, retry_count, sent_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            reportId,
            userId,
            token.device_token,
            canonicalStatus,
            content.title,
            content.body,
            deliveryStatus,
            errorMessage,
            retryCount,
            formatDateForMySQL(currentTimestamp),
          ],
        );
      } catch (logError) {
        // Don't fail the entire operation if logging fails
        console.error("Failed to log notification attempt:", logError);
      }
    }

    console.info(
      `Notification sent for report ${reportId}, status: ${canonicalStatus}, user: ${userId}`,
    );
  } catch (error: any) {
    // Handle errors gracefully without throwing (Requirement 5.4)
    console.error(`Error in sendReportStatusNotification:`, error);
    // Don't throw - we don't want to block the report status update
  }
}
