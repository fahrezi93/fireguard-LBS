/**
 * Next.js Instrumentation Hook
 *
 * File ini dipanggil SEKALI oleh Next.js setiap kali server instance baru dimulai,
 * sebelum request pertama masuk. Ini adalah tempat yang tepat untuk inisialisasi
 * seperti setup tabel database, warmup koneksi, dll.
 *
 * Ref: https://nextjs.org/docs/app/guides/instrumentation
 */

export async function register() {
  // Hanya jalankan di server-side (Node.js runtime), bukan Edge runtime
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      // Import secara dinamis untuk memastikan ini hanya berjalan di Node.js runtime
      const { ensureNotificationTables } = await import('@/lib/db-init');
      await ensureNotificationTables();
      console.log('[Instrumentation] Database tables initialized at server startup ✓');
    } catch (error: any) {
      // Jangan crash server jika inisialisasi gagal — cukup log error-nya
      // Tabel mungkin sudah ada, atau koneksi DB belum siap saat cold start
      console.error('[Instrumentation] DB init warning (non-fatal):', error?.message);
    }
  }
}
