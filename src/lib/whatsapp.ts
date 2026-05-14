// Konfigurasi Fonnte
const FONNTE_TOKEN = process.env.FONNTE_TOKEN || "";
const ENABLE_WHATSAPP = process.env.ENABLE_WHATSAPP === "true";

/**
 * Fungsi dasar untuk mengirim pesan via WhatsApp menggunakan Fonnte
 */
export async function sendWhatsApp(phone: string, message: string) {
  if (!ENABLE_WHATSAPP || !FONNTE_TOKEN) {
    console.warn("⚠️ WhatsApp is disabled or FONNTE_TOKEN is not set.");
    console.log(`📱 To: ${phone}`);
    console.log(`💬 Message: ${message}`);
    return { success: true, message: "WhatsApp Disabled" };
  }

  // Format nomor: pastikan menggunakan kode negara
  let targetPhone = phone.replace(/\D/g, "");
  if (targetPhone.startsWith("0")) {
    targetPhone = "62" + targetPhone.substring(1);
  }

  const data = new FormData();
  data.append("target", targetPhone);
  data.append("message", message);
  data.append("countryCode", "62");

  try {
    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: FONNTE_TOKEN },
      body: data,
    });

    const result = await response.json();
    if (result.status) {
      return { success: true };
    } else {
      console.error('❌ Fonnte Error:', result.reason || result.detail || JSON.stringify(result));
      return { success: false, error: result.reason || "Failed to send WhatsApp message" };
    }
  } catch (error: any) {
    console.error('❌ Error sending WhatsApp:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Kirim OTP via WhatsApp dengan template yang diperbarui
 */
export async function sendWhatsAppOTP(phone: string, otp: string, type: 'register' | 'login' | 'reset' = 'login') {
  let action = "";
  let subject = "";

  if (type === 'register') {
    subject = "Pendaftaran";
    action = "menyelesaikan pendaftaran akun FireGuard Anda";
  } else if (type === 'login') {
    subject = "Login";
    action = "masuk ke akun FireGuard Anda";
  } else if (type === 'reset') {
    subject = "Reset Password";
    action = "mereset kata sandi akun FireGuard Anda";
  }

  const message = `*🔥 FireGuard - ${subject}*\n\nGunakan kode OTP berikut untuk ${action}:\n\n👉 *${otp}*\n\n⚠️ _Berlaku selama 10 menit. Jangan bagikan kode ini kepada siapapun demi keamanan akun Anda._\n\n_Sent via FireGuard System_`;

  return sendWhatsApp(phone, message);
}

/**
 * Kirim Update Status Laporan via WhatsApp
 */
export async function sendWhatsAppReportUpdate(
  phone: string, 
  userName: string, 
  reportId: string | number, 
  statusLabel: string, 
  address: string, 
  adminNotes?: string
) {
  // Template yang lebih profesional dan informatif
  let message = `*🔥 FIREGUARD - NOTIFIKASI STATUS*\n\n`;
  message += `Halo *${userName}*,\n`;
  message += `Laporan kejadian Anda dengan ID *#${reportId}* telah diperbarui oleh petugas.\n\n`;
  message += `━━━━━━━━━━━━━━━━━━\n`;
  message += `📌 *STATUS BARU:* ${statusLabel.toUpperCase()}\n`;
  message += `📍 *LOKASI:* ${address}\n`;
  
  if (adminNotes) {
    message += `💬 *CATATAN:* ${adminNotes}\n`;
  }
  message += `━━━━━━━━━━━━━━━━━━\n\n`;
  message += `Terima kasih telah berkontribusi dalam menjaga keamanan lingkungan. Tetap waspada dan utamakan keselamatan!\n\n`;
  message += `_Pesan ini dikirim secara otomatis oleh sistem FireGuard_`;

  return sendWhatsApp(phone, message);
}
