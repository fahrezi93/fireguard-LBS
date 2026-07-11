import { config } from 'dotenv';
// Load environment variables FIRST before importing any local modules
config({ path: '.env.local' });
config({ path: '.env' });

// Use dynamic import or require after env is loaded
async function runTest() {
  const { sendWhatsApp } = await import('./src/lib/whatsapp');

  // Ganti dengan nomor Anda yang valid
  const targetPhone = "085872381791";
  const message = "Ini adalah pesan percobaan dari script test-wa.ts untuk menguji fitur Fallback.";

  console.log(`Mengirim pesan ke ${targetPhone}...`);
  console.log("Pastikan wa-server dimatikan untuk menguji fallback ke Fonnte.");

  const result = await sendWhatsApp(targetPhone, message);

  if (result.success) {
    console.log("✅ Pesan berhasil terkirim!");
  } else {
    console.error("❌ Gagal mengirim pesan:", result.error);
  }
}

runTest();
