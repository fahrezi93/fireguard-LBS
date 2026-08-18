import { NextRequest } from "next/server";
import { queryRow } from "@/lib/db";
import { getAuthPayloadFromRequest, handleCorsOptions, jsonWithCors } from "@/lib/cors";
import { getMessaging } from "@/lib/firebase-admin";

export async function OPTIONS() {
  return handleCorsOptions();
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthPayloadFromRequest(request);
    
    // Pastikan user adalah petugas
    if (user.role?.toUpperCase() !== 'PETUGAS') {
      return jsonWithCors({ message: "Akses ditolak. Hanya untuk petugas." }, { status: 403, request });
    }

    // Ambil token FCM petugas dari DB device_tokens
    const petugasToken = await queryRow<any>(
      'SELECT device_token FROM device_tokens WHERE user_id = ? AND is_active = TRUE ORDER BY id DESC LIMIT 1',
      [user.id]
    );

    if (!petugasToken || !petugasToken.device_token) {
      return jsonWithCors({ message: "Token FCM belum terdaftar di database. Silakan restart aplikasi agar token tersimpan." }, { status: 400, request });
    }

    const fcmToken = petugasToken.device_token;

    // Kirim pesan test FCM
    const message = {
      token: fcmToken,
      notification: {
        title: "TEST NOTIFIKASI 🔥",
        body: "Ini adalah notifikasi percobaan. Jika pesan ini masuk, FCM kamu berfungsi dengan baik!",
        imageUrl: "https://res.cloudinary.com/dsbdjzrin/image/upload/v1700000000/fire-test.jpg"
      },
      data: {
        click_action: "FLUTTER_NOTIFICATION_CLICK",
        target: "mobile",
        type: "test"
      }
    };

    const messaging = await getMessaging();
    if (!messaging) {
      return jsonWithCors({ message: "Firebase Admin belum dikonfigurasi di server." }, { status: 500, request });
    }
    
    try {
      await messaging.send(message);
    } catch (fcmErr: any) {
      console.error("Test FCM Send Error:", fcmErr);
      return jsonWithCors({
        success: false,
        message: "Gagal mengirim FCM: " + fcmErr.message,
        code: fcmErr.code
      }, { status: 500, request });
    }

    return jsonWithCors({
      success: true,
      message: "Notifikasi test berhasil dikirim!",
    }, { status: 200, request });

  } catch (error: any) {
    if (error.message?.includes("autentikasi") || error.message?.includes("Token")) {
      return jsonWithCors({ message: "Akses ditolak." }, { status: 401, request });
    }
    console.error("Test FCM Error:", error);
    return jsonWithCors({
      success: false,
      message: "Terjadi kesalahan saat mengirim notifikasi.",
    }, { status: 500, request });
  }
}
