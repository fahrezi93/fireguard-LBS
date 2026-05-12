import nodemailer from 'nodemailer';

// Konfigurasi Email Transporter
// Development: Gunakan Mailpit (Laragon) di port 1025
// Production: Gunakan Gmail SMTP dengan App Password

const isDevelopment = process.env.NODE_ENV !== 'production';

// Cek apakah menggunakan Mailpit (development) atau Gmail (production)
const transporter = isDevelopment && (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD)
  ? nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'localhost',
    port: parseInt(process.env.MAIL_PORT || '1025'),
    secure: false,
    ignoreTLS: true,
  })
  : nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    // Optimasi untuk VPS (DigitalOcean)
    connectionTimeout: 10000, // 10 detik timeout koneksi
    greetingTimeout: 10000,   // 10 detik timeout greeting
    socketTimeout: 20000,     // 20 detik timeout socket
    pool: true, 
    maxConnections: 3, 
    maxMessages: 100, 
    rateDelta: 1000, 
    rateLimit: 5, 
  });

// Verify transporter connection on startup
transporter.verify().then(() => {
  console.log('✅ Email transporter is ready');
}).catch((error) => {
  console.error('❌ Email transporter error:', error);
});

// Email pengirim default
const FROM_EMAIL = process.env.GMAIL_USER || 'fireguard@plaju.go.id';

/**
 * Kirim OTP via Email
 */
export async function sendEmailOTP(email: string, otp: string, type: 'register' | 'login' = 'login') {
  const subject = type === 'register'
    ? '🔐 Kode Verifikasi Pendaftaran FireGuard'
    : '🔐 Kode Login FireGuard';

  // Logo base URL - gunakan URL publik atau base64
  const logoUrl = process.env.NEXT_PUBLIC_BASE_URL
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/favicon.png`
    : 'https://www.fireguard-palembang.my.id/favicon.png';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&family=Roboto:wght@300;400;500&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 0; background-color: #F9FAFB; font-family: 'Roboto', Arial, sans-serif; color: #4B5563;">
      <div style="max-width: 600px; margin: 40px auto; background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);">
        
        <!-- Header -->
        <div style="padding: 40px 30px; text-align: center; border-bottom: 1px solid #F3F4F6; background: radial-gradient(circle at top, rgba(239, 68, 68, 0.08) 0%, transparent 70%);">
          <div style="display: inline-block; padding: 10px; background: linear-gradient(135deg, #EF4444 0%, #F97316 100%); border-radius: 16px; margin-bottom: 16px; box-shadow: 0 10px 20px rgba(239, 68, 68, 0.2);">
            <img src="${logoUrl}" alt="FireGuard" width="40" height="40" style="display: block; border-radius: 8px; background: #FFFFFF; padding: 4px;" />
          </div>
          <h1 style="margin: 0; font-family: 'Poppins', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #111827; letter-spacing: -0.5px;">FireGuard</h1>
          <p style="margin: 8px 0 0; font-size: 14px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; color: #EF4444;">Sistem Pelaporan Darurat</p>
        </div>

        <!-- Body -->
        <div style="padding: 40px 30px;">
          <h2 style="margin: 0 0 16px; font-family: 'Poppins', Arial, sans-serif; font-size: 20px; font-weight: 600; color: #111827;">
            ${type === 'register' ? 'Verifikasi Email Anda' : 'Kode Login Anda'}
          </h2>
          <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #4B5563;">
            ${type === 'register'
      ? 'Gunakan kode OTP berikut untuk menyelesaikan pendaftaran akun FireGuard Anda. Kode ini bersifat rahasia.'
      : 'Gunakan kode OTP berikut untuk masuk ke akun FireGuard Anda. Kode ini bersifat rahasia.'}
          </p>

          <!-- OTP Box -->
          <div style="background-color: rgba(239, 68, 68, 0.05); border: 1px dashed rgba(239, 68, 68, 0.5); border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 32px;">
            <span style="font-family: 'Poppins', monospace; font-size: 42px; font-weight: 700; letter-spacing: 12px; color: #EF4444;">${otp}</span>
          </div>

          <div style="background-color: #F9FAFB; border: 1px solid #F3F4F6; border-radius: 12px; padding: 16px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="30" valign="top" style="font-size: 20px;">⏱️</td>
                <td valign="top">
                  <p style="margin: 0 0 4px; font-size: 14px; color: #374151;">Berlaku selama <strong>5 menit</strong></p>
                  <p style="margin: 0; font-size: 12px; color: #6B7280;">Jangan bagikan kode ini kepada siapapun, termasuk pihak FireGuard.</p>
                </td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding: 24px 30px; background-color: #F9FAFB; border-top: 1px solid #E5E7EB; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #9CA3AF; line-height: 1.6;">
            &copy; ${new Date().getFullYear()} FireGuard.<br>Mengabdi untuk publik. Hak Cipta Dilindungi.<br>Kec. Plaju, Palembang.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    console.log(`📧 Sending OTP email to: ${email}`);
    console.log(`🔑 OTP Code: ${otp}`);

    await transporter.sendMail({
      from: `"FireGuard" <${FROM_EMAIL}>`,
      to: email,
      subject,
      html,
    });

    console.log(`✅ Email sent successfully to: ${email}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error sending email OTP:', error);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 OTP (for testing): ${otp}`);
    return { success: false, error: error.message };
  }
}

/**
 * Kirim notifikasi update status laporan via Email
 */
export async function sendStatusUpdateEmail(
  email: string,
  name: string,
  reportId: number,
  newStatus: string,
  adminNotes?: string
) {
  const statusLabels: Record<string, { label: string; color: string; emoji: string }> = {
    pending: { label: 'Menunggu', color: '#F59E0B', emoji: '⏳' },
    approved: { label: 'Laporan Disetujui', color: '#2563EB', emoji: '✅' },
    in_progress: { label: 'Sedang Ditangani', color: '#3B82F6', emoji: '🔄' },
    completed: { label: 'Selesai', color: '#10B981', emoji: '✅' },
    verified: { label: 'Terverifikasi', color: '#0EA5E9', emoji: '✅' },
    false_report: { label: 'Laporan Palsu', color: '#EF4444', emoji: '⚠️' },
    diproses: { label: 'Sedang Diproses', color: '#3B82F6', emoji: '🔄' },
    dikirim: { label: 'Tim Dikirim', color: '#8B5CF6', emoji: '🚒' },
    ditangani: { label: 'Sedang Ditangani', color: '#06B6D4', emoji: '👨‍🚒' },
    dispatched: { label: 'Unit Dikirim', color: '#8B5CF6', emoji: '🚒' },
    arrived: { label: 'Unit Tiba', color: '#6366F1', emoji: '📍' },
    selesai: { label: 'Selesai', color: '#10B981', emoji: '✅' },
    dibatalkan: { label: 'Dibatalkan', color: '#EF4444', emoji: '❌' },
    false: { label: 'Laporan Palsu', color: '#EF4444', emoji: '⚠️' },
  };

  const status = statusLabels[newStatus] || { label: newStatus, color: '#6B7280', emoji: '📋' };

  // Logo base URL
  const logoUrl = process.env.NEXT_PUBLIC_BASE_URL
    ? `${process.env.NEXT_PUBLIC_BASE_URL}/favicon.png`
    : 'https://www.fireguard-palembang.my.id/favicon.png';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&family=Roboto:wght@300;400;500&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 0; background-color: #F9FAFB; font-family: 'Roboto', Arial, sans-serif; color: #4B5563;">
      <div style="max-width: 600px; margin: 40px auto; background-color: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);">
        
        <!-- Header -->
        <div style="padding: 40px 30px; text-align: center; border-bottom: 1px solid #F3F4F6; background: radial-gradient(circle at top, rgba(239, 68, 68, 0.08) 0%, transparent 70%);">
          <div style="display: inline-block; padding: 10px; background: linear-gradient(135deg, #EF4444 0%, #F97316 100%); border-radius: 16px; margin-bottom: 16px; box-shadow: 0 10px 20px rgba(239, 68, 68, 0.2);">
            <img src="${logoUrl}" alt="FireGuard" width="40" height="40" style="display: block; border-radius: 8px; background: #FFFFFF; padding: 4px;" />
          </div>
          <h1 style="margin: 0; font-family: 'Poppins', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #111827; letter-spacing: -0.5px;">FireGuard</h1>
          <p style="margin: 8px 0 0; font-size: 14px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; color: #EF4444;">Update Laporan</p>
        </div>

        <!-- Body -->
        <div style="padding: 40px 30px;">
          <p style="margin: 0 0 16px; font-size: 16px; color: #374151;">Halo <strong style="color: #111827;">${name}</strong>,</p>
          <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #4B5563;">
            Status laporan darurat Anda dengan ID <strong style="color: #111827;">#${reportId}</strong> telah diperbarui oleh operator pusat:
          </p>

          <!-- Status Box -->
          <div style="background-color: #F9FAFB; border: 1px solid #F3F4F6; border-left: 4px solid ${status.color}; border-radius: 0 12px 12px 0; padding: 20px 24px; margin-bottom: 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="40" valign="middle" style="font-size: 28px;">${status.emoji}</td>
                <td valign="middle">
                  <p style="margin: 0; font-family: 'Poppins', Arial, sans-serif; font-size: 24px; font-weight: 600; color: ${status.color};">${status.label}</p>
                </td>
              </tr>
            </table>
          </div>

          ${adminNotes ? `
            <div style="background-color: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 12px; padding: 20px; margin-bottom: 32px;">
              <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #D97706;">
                📝 Catatan Petugas:
              </p>
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #4B5563; font-style: italic;">
                "${adminNotes}"
              </p>
            </div>
          ` : ''}

          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #6B7280; text-align: center;">
            Terima kasih telah menggunakan FireGuard untuk menjaga keselamatan lingkungan Anda.
          </p>
        </div>

        <!-- Footer -->
        <div style="padding: 24px 30px; background-color: #F9FAFB; border-top: 1px solid #E5E7EB; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #9CA3AF; line-height: 1.6;">
            &copy; ${new Date().getFullYear()} FireGuard.<br>Mengabdi untuk publik. Hak Cipta Dilindungi.<br>Kec. Plaju, Palembang.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"FireGuard" <${FROM_EMAIL}>`,
      to: email,
      subject: `${status.emoji} Laporan #${reportId}: ${status.label}`,
      html,
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error sending status update email:', error);
    return { success: false, error: error.message };
  }
}
