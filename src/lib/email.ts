import { Resend } from 'resend';
import dns from 'dns';

// Fix for Node.js 18+ Windows IPv6 DNS timeout bug with api.resend.com (Unable to fetch data)
dns.setDefaultResultOrder('ipv4first');

/**
 * Email Service — menggunakan Resend API
 *
 * Resend bekerja via HTTPS (bukan SMTP), sehingga tidak terblokir
 * oleh DigitalOcean yang memblokir port 25, 465, dan 587.
 *
 * Setup:
 *   1. Daftar di https://resend.com dan dapatkan API key
 *   2. Verifikasi domain di Resend Dashboard → Domains
 *   3. Set RESEND_API_KEY dan RESEND_FROM_EMAIL di .env
 */

// ── Inisialisasi Resend client ────────────────────────────────────────────────
const resend = new Resend(process.env.RESEND_API_KEY);

// Alamat pengirim — harus menggunakan domain yang sudah diverifikasi di Resend
// Contoh: "SiagaBencana <noreply@siagabencana-palembang.my.id>"
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'SiagaBencana <noreply@siagabencana-palembang.my.id>';

// Logo URL untuk template email
const getLogoUrl = () => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  // Jangan gunakan localhost untuk email karena Gmail tidak bisa meloadnya
  if (baseUrl && !baseUrl.includes('localhost') && !baseUrl.includes('127.0.0.1') && !baseUrl.includes('192.168.')) {
    return `${baseUrl}/favicon.png`;
  }
  // Fallback ke public CDN icon jika sedang development lokal atau belum ada domain
  return 'https://cdn-icons-png.flaticon.com/512/792/792113.png';
};

// ── Template HTML helpers ─────────────────────────────────────────────────────

function buildEmailWrapper(content: string): string {
  const logoUrl = getLogoUrl();
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#F9FAFB;font-family:'Plus Jakarta Sans',Arial,sans-serif;color:#1E293B;line-height:1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F9FAFB;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E2E8F0;box-shadow:0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:40px 40px 24px 40px;text-align:center;border-bottom:1px solid #F1F5F9;">
              <img src="${logoUrl}" alt="SiagaBencana" width="48" height="48" style="display:inline-block;margin-bottom:16px;border-radius:12px;" />
              <h1 style="margin:0;font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:24px;font-weight:700;color:#0F172A;letter-spacing:-0.5px;">SiagaBencana</h1>
              <p style="margin:4px 0 0;font-size:13px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#DC2626;">Sistem Pelaporan Darurat</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:32px 40px;background-color:#F8FAFC;border-top:1px solid #F1F5F9;text-align:center;">
              <p style="margin:0;font-size:13px;color:#64748B;line-height:1.6;">
                &copy; ${new Date().getFullYear()} SiagaBencana.<br>Mengabdi untuk publik. Hak Cipta Dilindungi.<br>Kec. Plaju, Palembang.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── sendEmailOTP ──────────────────────────────────────────────────────────────

/**
 * Kirim OTP via Email menggunakan Resend API.
 *
 * @param email   - Alamat email tujuan
 * @param otp     - Kode OTP 6 digit
 * @param type    - 'register' | 'login' (default: 'login')
 */
export async function sendEmailOTP(
  email: string,
  otp: string,
  type: 'register' | 'login' | 'reset' = 'login',
): Promise<{ success: boolean; error?: string }> {
  const subject =
    type === 'register'
      ? '🔐 Kode Verifikasi Pendaftaran SiagaBencana'
      : type === 'reset'
      ? '🔐 Kode Reset Password SiagaBencana'
      : '🔐 Kode Login SiagaBencana';

  const bodyContent = `
    <h2 style="margin:0 0 12px;font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:20px;font-weight:700;color:#0F172A;letter-spacing:-0.5px;">
      ${type === 'register' ? 'Verifikasi Pendaftaran' : type === 'reset' ? 'Reset Password Akun' : 'Kode Login Autentikasi'}
    </h2>
    <p style="margin:0 0 32px;font-size:15px;line-height:1.6;color:#475569;">
      ${type === 'register'
        ? 'Gunakan kode OTP berikut untuk menyelesaikan pendaftaran akun SiagaBencana Anda. Kode ini bersifat rahasia.'
        : type === 'reset'
        ? 'Gunakan kode OTP berikut untuk mereset kata sandi akun SiagaBencana Anda. Kode ini bersifat rahasia.'
        : 'Gunakan kode OTP berikut untuk masuk ke akun SiagaBencana Anda. Kode ini bersifat rahasia.'}
    </p>
    <!-- OTP Box -->
    <div style="background-color:#FEF2F2;border:1px solid #FECACA;border-radius:12px;padding:28px;text-align:center;margin-bottom:32px;">
      <span style="font-family:'Plus Jakarta Sans',monospace;font-size:36px;font-weight:700;letter-spacing:8px;color:#DC2626;">${otp}</span>
    </div>
    <div style="background-color:#F8FAFC;border-left:4px solid #CBD5E1;border-radius:0 8px 8px 0;padding:16px 20px;">
      <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#334155;">Peringatan Keamanan</p>
      <p style="margin:0;font-size:13px;color:#64748B;line-height:1.5;">
        Kode ini berlaku selama <strong>5 menit</strong>. Jangan bagikan kode ini kepada siapapun demi keamanan akun Anda.
      </p>
    </div>
  `;

  try {
    console.log(`📧 [Resend] Sending OTP email to: ${email}`);

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject,
      html: buildEmailWrapper(bodyContent),
    });

    if (error) {
      console.error('❌ [Resend] Error sending OTP email:', error);
      console.log(`🔑 OTP (for debugging): ${otp}`);
      return { success: false, error: error.message };
    }

    console.log(`✅ [Resend] OTP email sent successfully to ${email}. ID: ${data?.id}`);
    return { success: true };
  } catch (err: any) {
    console.error('❌ [Resend] Unexpected error sending OTP email:', err);
    console.log(`🔑 OTP (for debugging): ${otp}`);
    return { success: false, error: err?.message ?? 'Unknown error' };
  }
}

// ── sendStatusUpdateEmail ─────────────────────────────────────────────────────

/**
 * Kirim notifikasi update status laporan via Email menggunakan Resend API.
 *
 * @param email      - Alamat email tujuan
 * @param name       - Nama pengguna
 * @param reportId   - ID laporan
 * @param newStatus  - Status baru laporan
 * @param adminNotes - Catatan operator (opsional)
 */
export async function sendStatusUpdateEmail(
  email: string,
  name: string,
  reportId: number,
  newStatus: string,
  adminNotes?: string,
): Promise<{ success: boolean; error?: string }> {
  const statusLabels: Record<string, { label: string; color: string; emoji: string }> = {
    pending:      { label: 'Menunggu',          color: '#F59E0B', emoji: '⏳' },
    submitted:    { label: 'Menunggu Verifikasi',color: '#F59E0B', emoji: '⏳' },
    approved:     { label: 'Laporan Disetujui', color: '#2563EB', emoji: '✅' },
    in_progress:  { label: 'Sedang Ditangani',  color: '#3B82F6', emoji: '🔄' },
    completed:    { label: 'Selesai',            color: '#10B981', emoji: '✅' },
    verified:     { label: 'Terverifikasi',      color: '#0EA5E9', emoji: '✅' },
    false_report: { label: 'Laporan Palsu',      color: '#9F1C19', emoji: '⚠️' },
    diproses:     { label: 'Sedang Diproses',    color: '#3B82F6', emoji: '🔄' },
    dikirim:      { label: 'Tim Dikirim',        color: '#8B5CF6', emoji: '🚒' },
    ditangani:    { label: 'Sedang Ditangani',   color: '#06B6D4', emoji: '👨‍🚒' },
    dispatched:   { label: 'Unit Dikirim',       color: '#8B5CF6', emoji: '🚒' },
    arrived:      { label: 'Unit Tiba',          color: '#6366F1', emoji: '📍' },
    selesai:      { label: 'Selesai',            color: '#10B981', emoji: '✅' },
    dibatalkan:   { label: 'Dibatalkan',         color: '#9F1C19', emoji: '❌' },
    false:        { label: 'Laporan Palsu',      color: '#9F1C19', emoji: '⚠️' },
  };

  const status = statusLabels[newStatus] || { label: newStatus, color: '#64748B', emoji: '📋' };

  const adminNotesBlock = adminNotes
    ? `<div style="background-color:#FFFBEB;border:1px solid #FEF3C7;border-radius:8px;padding:20px;margin-bottom:32px;">
        <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#D97706;text-transform:uppercase;letter-spacing:0.5px;">Catatan Operator</p>
        <p style="margin:0;font-size:15px;line-height:1.6;color:#92400E;">"${adminNotes}"</p>
      </div>`
    : '';

  const bodyContent = `
    <p style="margin:0 0 12px;font-size:16px;color:#475569;">Halo <strong style="color:#0F172A;">${name}</strong>,</p>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569;">
      Status laporan darurat Anda dengan ID <strong style="color:#0F172A;">#${reportId}</strong> telah diperbarui.
    </p>
    <!-- Status Box -->
    <div style="margin-bottom:32px;padding:20px 24px;background-color:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;">Status Saat Ini</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="36" valign="middle" style="font-size:24px;">${status.emoji}</td>
          <td valign="middle">
            <span style="font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:20px;font-weight:700;color:${status.color};">${status.label}</span>
          </td>
        </tr>
      </table>
    </div>
    ${adminNotesBlock}
    <div style="border-top:1px solid #E2E8F0;padding-top:24px;">
      <p style="margin:0;font-size:14px;line-height:1.6;color:#64748B;">
        Terima kasih telah berpartisipasi menjaga keselamatan bersama. Tim kami selalu siap siaga.
      </p>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: `${status.emoji} Laporan #${reportId}: ${status.label}`,
      html: buildEmailWrapper(bodyContent),
    });

    if (error) {
      console.error('[Resend] Error sending status update email:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ [Resend] Status update email sent. ID: ${data?.id}`);
    return { success: true };
  } catch (err: any) {
    console.error('[Resend] Unexpected error sending status update email:', err);
    return { success: false, error: err?.message ?? 'Unknown error' };
  }
}
