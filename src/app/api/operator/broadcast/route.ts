/**
 * POST /api/operator/broadcast
 *
 * Endpoint untuk operator mengirim notifikasi broadcast ke SEMUA pengguna.
 * Mirip cara kerja info-notif Tokopedia / Gojek.
 *
 * Flow:
 *   1. Validasi sesi operator via cookie (pakai requireOperator)
 *   2. Validasi input: title & message wajib ada
 *   3. Simpan record ke tabel `notifications` untuk semua user
 *   4. Ambil semua device_token aktif dari tabel `device_tokens`
 *   5. Kirim FCM multicast via Firebase Admin (sendEachForMulticast, max 500/batch)
 *   6. Log hasil ke `broadcast_logs`
 *   7. Return summary
 *
 * GET /api/operator/broadcast — riwayat broadcast yang pernah dikirim
 */

import { NextRequest } from 'next/server';
import { queryRows, execute, formatDateForMySQL } from '@/lib/db';
import { requireOperator } from '@/lib/api-security';
import { jsonWithCors, handleCorsOptions } from '@/lib/cors';
import { getMessaging } from '@/lib/firebase-admin';
import { ensureNotificationTables } from '@/lib/db-init';

export async function OPTIONS() {
    return handleCorsOptions();
}

export async function POST(request: NextRequest) {
    try {
        // 1. Verifikasi operator (cookie JWT dengan isOperator: true)
        const auth = await requireOperator(request);
        if ('response' in auth) return auth.response;
        const operatorId = auth.payload.id;

        // 2. Validasi input
        const body = await request.json();
        const title: string = (body.title ?? '').trim();
        const message: string = (body.message ?? '').trim();

        if (!title || !message) {
            return jsonWithCors({ message: 'Judul dan isi pesan wajib diisi.' }, { status: 400 });
        }
        if (title.length > 200) {
            return jsonWithCors({ message: 'Judul terlalu panjang (maks 200 karakter).' }, { status: 400 });
        }
        if (message.length > 1000) {
            return jsonWithCors({ message: 'Pesan terlalu panjang (maks 1000 karakter).' }, { status: 400 });
        }

        // 3. Pastikan semua tabel notification sudah ada
        await ensureNotificationTables();

        const now = formatDateForMySQL(new Date());

        // 4. Ambil semua user_id yang terdaftar
        const users = await queryRows<{ id: number }>('SELECT id FROM users');

        // 5. Simpan notifikasi ke tabel `notifications` untuk semua user sekaligus
        // Simpan ID per user agar bisa disertakan di FCM payload untuk dedup di mobile
        const userNotifIds = new Map<number, number>(); // userId → notificationId
        if (users.length > 0) {
            for (const user of users) {
                try {
                    const { executeAndGetLastInsertId } = await import('@/lib/db');
                    const notifId = await executeAndGetLastInsertId(
                        `INSERT INTO notifications (user_id, title, message, type, created_at) VALUES (?, ?, ?, ?, ?)`,
                        [user.id, title, message, 'broadcast', now]
                    );
                    userNotifIds.set(user.id, notifId);
                } catch (insertErr) {
                    console.error(`[Broadcast] Gagal insert notif untuk user ${user.id}:`, insertErr);
                }
            }
        }

        // 6. Ambil semua device token aktif (Android & iOS) beserta user_id-nya
        const tokenRows = await queryRows<{ device_token: string; user_id: number }>(
            `SELECT device_token, user_id
             FROM device_tokens
             WHERE is_active = TRUE
               AND platform IN ('android', 'ios')`
        );

        let successCount = 0;
        let failureCount = 0;
        const firebase = getMessaging();

        if (firebase && tokenRows.length > 0) {
            // Kirim per-token agar bisa sertakan notificationId yang tepat per user
            const BATCH_SIZE = 500;
            // Group token by notificationId untuk efisiensi
            const tokensByNotifId = new Map<string, string[]>();
            for (const row of tokenRows) {
                const notifId = userNotifIds.get(row.user_id)?.toString() ?? '';
                if (!tokensByNotifId.has(notifId)) tokensByNotifId.set(notifId, []);
                tokensByNotifId.get(notifId)!.push(row.device_token);
            }

            for (const [notifId, tokens] of tokensByNotifId) {
                for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
                    const batch = tokens.slice(i, i + BATCH_SIZE);
                    try {
                        const batchResponse = await firebase.sendEachForMulticast({
                            tokens: batch,
                            notification: { title, body: message },
                            data: {
                                type: 'broadcast',
                                target: 'mobile',
                                ...(notifId ? { notificationId: notifId } : {}),
                                sentAt: now,
                            },
                            android: {
                                priority: 'high',
                                notification: {
                                    channelId: 'fireguard_reports',
                                    priority: 'high',
                                    sound: 'default',
                                    defaultSound: true,
                                    defaultVibrateTimings: true,
                                },
                            },
                            apns: {
                                payload: { aps: { sound: 'default', badge: 1 } },
                            },
                        });
                        successCount += batchResponse.successCount;
                        failureCount += batchResponse.failureCount;
                    } catch (err) {
                        console.error('[Broadcast] FCM batch error:', err);
                        failureCount += batch.length;
                    }
                }
            }
        }

        const allTokens = tokenRows.map(r => r.device_token);

        // 7. Log hasil ke tabel broadcast_logs
        try {
            await execute(
                `INSERT INTO broadcast_logs
                 (operator_id, title, message, total_tokens, success_count, failure_count, sent_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [operatorId, title, message, allTokens.length, successCount, failureCount, now]
            );
        } catch (logErr) {
            console.warn('[Broadcast] Gagal menyimpan log broadcast:', logErr);
        }

        return jsonWithCors({
            success: true,
            message: 'Broadcast berhasil dikirim!',
            summary: {
                total_users: users.length,
                total_tokens: allTokens.length,
                success: successCount,
                failure: failureCount,
                firebase_ready: firebase !== null,
            },
        });
    } catch (error: any) {
        console.error('[Broadcast] POST error:', error);
        return jsonWithCors(
            { message: 'Terjadi kesalahan saat mengirim broadcast.', error: error?.message },
            { status: 500 }
        );
    }
}

/** GET /api/operator/broadcast — riwayat broadcast */
export async function GET(request: NextRequest) {
    try {
        const auth = await requireOperator(request);
        if ('response' in auth) return auth.response;

        await ensureNotificationTables();

        const logs = await queryRows<{
            id: number;
            title: string;
            message: string;
            total_tokens: number;
            success_count: number;
            failure_count: number;
            sent_at: string;
        }>(
            `SELECT id, title, message, total_tokens, success_count, failure_count, sent_at
             FROM broadcast_logs
             ORDER BY sent_at DESC
             LIMIT 30`
        );

        return jsonWithCors({ success: true, data: logs });
    } catch (error: any) {
        console.error('[Broadcast] GET error:', error);
        return jsonWithCors({ message: 'Gagal mengambil riwayat broadcast.' }, { status: 500 });
    }
}
