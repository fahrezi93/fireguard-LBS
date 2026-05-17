import { NextRequest } from 'next/server';
import { queryRows, execute } from '@/lib/db';
import { getAuthPayloadFromRequest, handleCorsOptions, jsonWithCors } from '@/lib/cors';

// OPTIONS: CORS preflight
export async function OPTIONS() {
    return handleCorsOptions();
}

async function getAuthPayload(request: NextRequest) {
    return getAuthPayloadFromRequest(request);
}

interface Notification {
    id: number;
    user_id: number;
    title: string;
    message: string;
    type: string;
    report_id?: number;
    is_read: boolean;
    created_at: string;
}

// GET: Ambil notifikasi user
export async function GET(request: NextRequest) {
    try {
        const user = await getAuthPayload(request);

        // Coba ambil notifikasi, jika tabel tidak ada, buat dulu
        let notifications: Notification[] = [];
        try {
            notifications = await queryRows<Notification>(
                `SELECT id, user_id, title, message, type, report_id, is_read, created_at 
         FROM notifications 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT 50`,
                [user.id]
            );
        } catch (error: any) {
            // Tabel belum ada, buat dulu
            if (error.message?.includes('doesn\'t exist') || error.code === 'ER_NO_SUCH_TABLE') {
                await execute(`
          CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(50) DEFAULT 'info',
            report_id INT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            INDEX idx_is_read (is_read),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);
                notifications = [];
            } else {
                throw error;
            }
        }

        // Hitung jumlah belum dibaca
        const unreadCount = notifications.filter(n => !n.is_read).length;

        return jsonWithCors({
            success: true,
            data: notifications,
            unreadCount
        });
    } catch (error: any) {
        console.error('Error fetching notifications:', error);
        if (error.message?.includes('autentikasi')) {
            return jsonWithCors({ message: 'Akses ditolak.' }, { status: 401 });
        }
        return jsonWithCors({ message: 'Gagal mengambil notifikasi' }, { status: 500 });
    }
}

// POST: Tandai notifikasi sudah dibaca
export async function POST(request: NextRequest) {
    try {
        const user = await getAuthPayload(request);
        const { action, notificationId } = await request.json();

        if (action === 'mark_read' && notificationId) {
            // Tandai satu notifikasi sudah dibaca
            await execute(
                'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
                [notificationId, user.id]
            );
        } else if (action === 'mark_all_read') {
            // Tandai semua notifikasi sudah dibaca
            await execute(
                'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
                [user.id]
            );
        }

        return jsonWithCors({ success: true, message: 'Notifikasi diperbarui' });
    } catch (error: any) {
        console.error('Error updating notification:', error);
        return jsonWithCors({ message: 'Gagal memperbarui notifikasi' }, { status: 500 });
    }
}

/**
 * DELETE /api/notifications
 * Hapus satu atau semua notifikasi milik user yang sedang login.
 *
 * Body (hapus satu):   { "notificationId": 123 }
 * Body (hapus semua):  { "deleteAll": true }
 *
 * Hanya bisa menghapus notifikasi milik user sendiri (WHERE user_id = ?).
 */
export async function DELETE(request: NextRequest) {
    try {
        const user = await getAuthPayload(request);

        let body: { notificationId?: number; deleteAll?: boolean } = {};
        try {
            body = await request.json();
        } catch {
            // Body kosong atau bukan JSON — anggap tidak ada parameter
        }

        const { notificationId, deleteAll } = body;

        if (deleteAll === true) {
            // Hapus semua notifikasi milik user ini
            await execute(
                'DELETE FROM notifications WHERE user_id = ?',
                [user.id]
            );
            return jsonWithCors({
                success: true,
                message: 'Semua notifikasi berhasil dihapus.',
            });
        }

        if (notificationId !== undefined) {
            const id = Number(notificationId);
            if (!Number.isInteger(id) || id <= 0) {
                return jsonWithCors(
                    { success: false, message: 'notificationId tidak valid.' },
                    { status: 400 }
                );
            }

            // Pastikan notifikasi ini milik user yang sedang login
            const result = await execute(
                'DELETE FROM notifications WHERE id = ? AND user_id = ?',
                [id, user.id]
            ) as any;

            if (result.affectedRows === 0) {
                return jsonWithCors(
                    { success: false, message: 'Notifikasi tidak ditemukan.' },
                    { status: 404 }
                );
            }

            return jsonWithCors({
                success: true,
                message: 'Notifikasi berhasil dihapus.',
            });
        }

        return jsonWithCors(
            { success: false, message: 'Sertakan notificationId atau deleteAll: true.' },
            { status: 400 }
        );
    } catch (error: any) {
        console.error('Error deleting notification:', error);
        if (error.message?.includes('autentikasi')) {
            return jsonWithCors({ message: 'Akses ditolak.' }, { status: 401 });
        }
        return jsonWithCors({ message: 'Gagal menghapus notifikasi.' }, { status: 500 });
    }
}
