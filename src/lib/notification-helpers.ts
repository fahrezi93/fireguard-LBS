import { executeAndGetLastInsertId, formatDateForMySQL } from '@/lib/db';

/**
 * Buat notifikasi baru di tabel `notifications`.
 *
 * @returns ID dari notifikasi yang baru dibuat, atau `null` jika gagal.
 */
export async function createNotification(
    userId: number,
    title: string,
    message: string,
    type: string = 'info',
    reportId?: number
): Promise<number | null> {
    try {
        const currentTimestamp = formatDateForMySQL(new Date());
        const id = await executeAndGetLastInsertId(
            `INSERT INTO notifications (user_id, title, message, type, report_id, is_read, created_at) 
       VALUES (?, ?, ?, ?, ?, FALSE, ?)`,
            [userId, title, message, type, reportId || null, currentTimestamp]
        );
        return typeof id === 'number' ? id : null;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
}
