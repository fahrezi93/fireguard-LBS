// Konfigurasi Fonnte
const FONNTE_TOKEN = process.env.FONNTE_TOKEN || "";
const ENABLE_WHATSAPP = process.env.ENABLE_WHATSAPP === "true";

/**
 * Kirim OTP via WhatsApp menggunakan Fonnte
 */
export async function sendWhatsAppOTP(phone: string, otp: string, type: 'register' | 'login' | 'reset' = 'login') {
  if (!ENABLE_WHATSAPP || !FONNTE_TOKEN) {
    console.warn("⚠️ WhatsApp is disabled or FONNTE_TOKEN is not set. OTP logged to console.");
    console.log(`📱 To: ${phone}`);
    console.log(`🔑 OTP: ${otp}`);
    return { success: true, message: "WhatsApp Disabled" }; // Return true for development fallback
  }

  // Format nomor: pastikan menggunakan kode negara
  let targetPhone = phone.replace(/\D/g, "");
  if (targetPhone.startsWith("0")) {
    targetPhone = "62" + targetPhone.substring(1);
  }

  let subject = "";
  let messageBody = "";

  if (type === 'register') {
    subject = "Pendaftaran FireGuard";
    messageBody = `Gunakan kode OTP berikut untuk menyelesaikan pendaftaran akun FireGuard Anda. Kode ini bersifat rahasia.\n\n*${otp}*\n\nBerlaku selama 5 menit. Jangan bagikan kode ini kepada siapapun.`;
  } else if (type === 'login') {
    subject = "Login FireGuard";
    messageBody = `Gunakan kode OTP berikut untuk masuk ke akun FireGuard Anda. Kode ini bersifat rahasia.\n\n*${otp}*\n\nBerlaku selama 5 menit. Jangan bagikan kode ini kepada siapapun.`;
  } else if (type === 'reset') {
    subject = "Reset Password FireGuard";
    messageBody = `Gunakan kode OTP berikut untuk mereset kata sandi akun FireGuard Anda.\n\n*${otp}*\n\nBerlaku selama 5 menit. Jika Anda tidak merasa melakukan permintaan ini, abaikan pesan ini.`;
  }

  const message = `*[FireGuard - ${subject}]*\n\n${messageBody}\n\n> _Sent via FireGuard_`;

  const data = new FormData();
  data.append("target", targetPhone);
  data.append("message", message);
  // Fonnte API parameter for countryCode 62
  data.append("countryCode", "62");

  try {
    console.log(`📱 Sending WhatsApp OTP to: ${targetPhone}`);
    
    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { 
        Authorization: FONNTE_TOKEN 
      },
      body: data,
    });

    const result = await response.json();
    
    if (result.status) {
      console.log(`✅ WhatsApp OTP sent successfully to: ${targetPhone}`);
      return { success: true };
    } else {
      console.error('❌ Fonnte Error:', result.reason || result.detail || JSON.stringify(result));
      return { success: false, error: result.reason || "Failed to send WhatsApp message" };
    }
  } catch (error: any) {
    console.error('❌ Error sending WhatsApp OTP:', error);
    console.log(`📱 To: ${phone}`);
    console.log(`🔑 OTP (for testing): ${otp}`);
    return { success: false, error: error.message };
  }
}
