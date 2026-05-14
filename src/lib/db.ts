import mysql from 'mysql2/promise';

// ── Pool MySQL — dioptimasi untuk VPS DigitalOcean (persistent server) ──
// Node.js timezone diset via TZ=Asia/Jakarta di .env, sehingga 'local'
// secara otomatis merujuk ke WIB tanpa perlu manual offset.
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'fireguard',
  waitForConnections: true,
  connectionLimit: 10,  // Lebih tinggi untuk VPS persistent (bukan serverless)
  queueLimit: 30,
  timezone: 'local',    // Mengikuti TZ=Asia/Jakarta dari .env → otomatis WIB
  dateStrings: false,
  // ── Mencegah ECONNRESET / ETIMEDOUT ──
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 8000,
  idleTimeout: 60000,   // VPS bisa keep idle lebih lama dari serverless
  maxIdle: 5,
});

// ── Error codes yang menandakan koneksi lama sudah mati ──
const STALE_CONNECTION_CODES = new Set([
  'ECONNRESET',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'PROTOCOL_CONNECTION_LOST',
  'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR',
]);

/**
 * Eksekusi query dengan satu kali retry otomatis jika koneksi stale.
 * Ini mengatasi kasus di mana MySQL men-drop koneksi idle (wait_timeout).
 */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    const code: string = err?.code ?? '';
    if (STALE_CONNECTION_CODES.has(code)) {
      // Koneksi lama mati — coba sekali lagi dengan koneksi fresh dari pool
      console.warn(`[db] Koneksi stale terdeteksi (${code}), mencoba ulang...`);
      return await fn();
    }
    throw err;
  }
}

// Fungsi untuk mengeksekusi query SELECT yang mengembalikan banyak baris
export async function queryRows<T>(sql: string, args?: any[]): Promise<T[]> {
  const [rows] = await withRetry(() => pool.execute(sql, args || []));
  return rows as T[];
}

// Fungsi untuk mengeksekusi query SELECT yang mengembalikan satu baris
export async function queryRow<T>(sql: string, args?: any[]): Promise<T | null> {
  const [rows] = await withRetry(() => pool.execute(sql, args || []));
  const result = rows as T[];
  return result[0] || null;
}

// Fungsi untuk mengeksekusi query INSERT, UPDATE, DELETE
export async function execute(sql: string, args?: any[]): Promise<number> {
  const [result] = await withRetry(() => pool.execute(sql, args || []));
  return (result as mysql.ResultSetHeader).affectedRows;
}

// Fungsi untuk mengeksekusi query INSERT dan mendapatkan ID baris terakhir
export async function executeAndGetLastInsertId(sql: string, args?: any[]): Promise<number> {
  const [result] = await withRetry(() => pool.execute(sql, args || []));
  return (result as mysql.ResultSetHeader).insertId;
}

// Export pool untuk akses langsung jika diperlukan
export { pool };

// Helper function untuk format Date ke format MySQL datetime (WIB)
// Menggunakan getHours/getMinutes/etc. (local time) yang secara otomatis
// mengacu ke WIB karena TZ=Asia/Jakarta sudah diset di environment VPS.
export function formatDateForMySQL(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

