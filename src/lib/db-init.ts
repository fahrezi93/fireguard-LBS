/**
 * Database initialization utility for notification tables.
 *
 * Membuat tabel-tabel notification secara otomatis jika belum ada di MySQL.
 * Dipanggil dari endpoint notification saat pertama kali digunakan.
 *
 * Tabel yang dikelola:
 *   - device_tokens          : menyimpan FCM token per user per device
 *   - notification_preferences: preferensi jenis notifikasi per user
 *   - notification_logs      : log setiap pengiriman notifikasi
 */

import { execute } from '@/lib/db';

let tablesInitialized = false;

/**
 * Pastikan semua tabel notification sudah ada.
 * Aman dipanggil berkali-kali — MySQL IF NOT EXISTS mencegah duplikasi.
 */
export async function ensureNotificationTables(): Promise<void> {
  // Hanya init sekali per process (singleton — aman untuk VPS persistent maupun serverless)
  if (tablesInitialized) return;

  try {
    // ── 1. device_tokens ──────────────────────────────────────────────────────
    await execute(`
      CREATE TABLE IF NOT EXISTS device_tokens (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        user_id       INT NOT NULL,
        device_token  VARCHAR(500) NOT NULL,
        platform      ENUM('android','ios') NOT NULL DEFAULT 'android',
        is_active     BOOLEAN NOT NULL DEFAULT TRUE,
        created_at    DATETIME NOT NULL,
        updated_at    DATETIME NOT NULL,
        last_used_at  DATETIME NOT NULL,
        UNIQUE  KEY uq_device_token (device_token),
        INDEX   idx_dt_user_id   (user_id),
        INDEX   idx_dt_is_active (is_active)
      )
    `);

    // ── 2. notification_preferences ───────────────────────────────────────────
    await execute(`
      CREATE TABLE IF NOT EXISTS notification_preferences (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        user_id      INT NOT NULL UNIQUE,
        approved     BOOLEAN NOT NULL DEFAULT TRUE,
        in_progress  BOOLEAN NOT NULL DEFAULT TRUE,
        completed    BOOLEAN NOT NULL DEFAULT TRUE,
        verified     BOOLEAN NOT NULL DEFAULT TRUE,
        false_report BOOLEAN NOT NULL DEFAULT TRUE,
        created_at   DATETIME NOT NULL,
        updated_at   DATETIME NOT NULL,
        INDEX idx_np_user_id (user_id)
      )
    `);

    // ── 3. notification_logs ──────────────────────────────────────────────────
    await execute(`
      CREATE TABLE IF NOT EXISTS notification_logs (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        report_id       INT NOT NULL,
        user_id         INT NOT NULL,
        device_token    VARCHAR(500) NOT NULL,
        status_change   VARCHAR(50)  NOT NULL,
        title           VARCHAR(255) NOT NULL,
        body            TEXT         NOT NULL,
        delivery_status ENUM('sent','failed','retry') NOT NULL,
        error_message   TEXT         NULL,
        retry_count     INT          NOT NULL DEFAULT 0,
        sent_at         DATETIME     NOT NULL,
        INDEX idx_nl_report_id (report_id),
        INDEX idx_nl_user_id   (user_id),
        INDEX idx_nl_sent_at   (sent_at)
      )
    `);

    // ── 4. broadcast_logs ────────────────────────────────────────────────────
    await execute(`
      CREATE TABLE IF NOT EXISTS broadcast_logs (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        operator_id   INT NOT NULL,
        title         VARCHAR(255) NOT NULL,
        message       TEXT NOT NULL,
        total_tokens  INT NOT NULL DEFAULT 0,
        success_count INT NOT NULL DEFAULT 0,
        failure_count INT NOT NULL DEFAULT 0,
        sent_at       DATETIME NOT NULL,
        INDEX idx_bl_operator_id (operator_id),
        INDEX idx_bl_sent_at (sent_at)
      )
    `);

    // ── 5. otp_attempts ──────────────────────────────────────────────────────
    await execute(`
      CREATE TABLE IF NOT EXISTS otp_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(100) NOT NULL,
        otp_hash VARCHAR(255) NOT NULL,
        type ENUM('register', 'login', 'reset') NOT NULL DEFAULT 'login',
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Pastikan ENUM pada tabel yang sudah ada mendukung 'reset'
    await execute(`
      ALTER TABLE otp_attempts MODIFY COLUMN type ENUM('register', 'login', 'reset') NOT NULL DEFAULT 'login'
    `).catch(() => {});

    tablesInitialized = true;
    console.log('[DB-Init] Notification and OTP tables verified/created ✓');
  } catch (error: any) {
    // Jangan throw — tabel mungkin sudah ada dengan struktur berbeda
    console.error('[DB-Init] Failed to ensure tables:', error?.message);
  }
}
