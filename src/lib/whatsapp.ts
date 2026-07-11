// Konfigurasi WhatsApp Server Lokal (Baileys)
const WA_SERVER_URL = process.env.WA_SERVER_URL || "http://localhost:3001";
// Konfigurasi Fonnte (Sebagai Fallback)
const FONNTE_TOKEN = process.env.FONNTE_TOKEN || "";
const ENABLE_WHATSAPP = process.env.ENABLE_WHATSAPP === "true";

export interface WhatsAppResult {
  success: boolean;
  message?: string;
  error?: any;
}

/**
 * Fungsi internal untuk mengirim via Fonnte
 */
async function sendViaFonnte(phone: string, message: string): Promise<WhatsAppResult> {
  if (!FONNTE_TOKEN) {
    console.error("❌ Fallback to Fonnte failed: FONNTE_TOKEN is not set.");
    return { success: false, error: "FONNTE_TOKEN is missing" };
  }

  // Format nomor untuk Fonnte: hilangkan 0 di depan, API Fonnte biasa menerima format '08...' atau '62...'
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
      console.log('✅ Fallback: Message sent successfully via Fonnte');
      return { success: true };
    } else {
      console.error('❌ Fonnte Error:', result.reason || result.detail || JSON.stringify(result));
      return { success: false, error: result.reason || "Failed to send WhatsApp message via Fonnte" };
    }
  } catch (error: any) {
    console.error('❌ Error sending WhatsApp via Fonnte:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fungsi dasar untuk mengirim pesan via WhatsApp (Coba Baileys -> Fallback ke Fonnte)
 */
export async function sendWhatsApp(phone: string, message: string): Promise<WhatsAppResult> {
  if (!ENABLE_WHATSAPP) {
    console.warn("⚠️ WhatsApp is disabled.");
    console.log(`📱 To: ${phone}`);
    console.log(`💬 Message: ${message}`);
    return { success: true, message: "WhatsApp Disabled" };
  }

  try {
    // 1. Mencoba mengirim via Local Baileys Server
    const response = await fetch(`${WA_SERVER_URL}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: phone, message: message }),
    });

    const result = await response.json();
    if (result.success) {
      console.log('✅ Message sent successfully via Baileys Local Server');
      return { success: true };
    } else {
      console.warn('⚠️ Baileys Server Failed (Not connected / Error):', result.error);
      console.log('🔄 Switching to Fonnte Fallback...');
      return await sendViaFonnte(phone, message);
    }
  } catch (error: any) {
    // Ini terjadi jika Local Server mati (ECONNREFUSED)
    console.warn(`⚠️ Baileys Server Unreachable (${error.message}). Switching to Fonnte Fallback...`);
    return await sendViaFonnte(phone, message);
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
    action = "menyelesaikan pendaftaran akun SiagaBencana Anda";
  } else if (type === 'login') {
    subject = "Login";
    action = "masuk ke akun SiagaBencana Anda";
  } else if (type === 'reset') {
    subject = "Reset Password";
    action = "mereset kata sandi akun SiagaBencana Anda";
  }

  const message = `*🔥 SiagaBencana - ${subject}*\n\nGunakan kode OTP berikut untuk ${action}:\n\n👉 *${otp}*\n\n⚠️ _Berlaku selama 10 menit. Jangan bagikan kode ini kepada siapapun demi keamanan akun Anda._\n\n_Sent via SiagaBencana System_`;

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
  let message = `*🔥 SIAGABENCANA - NOTIFIKASI STATUS*\n\n`;
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
  message += `_Pesan ini dikirim secara otomatis oleh sistem SiagaBencana_`;

  return sendWhatsApp(phone, message);
}
