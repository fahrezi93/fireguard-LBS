import * as admin from "firebase-admin";

/**
 * Initialize Firebase Admin SDK for server-side operations.
 *
 * Membaca FIREBASE_SERVICE_ACCOUNT_KEY dari environment variable.
 * Mendukung beberapa format input yang umum salah di-set:
 *   ✅ {"type":"service_account",...}          ← format benar
 *   🔧 FIREBASE_SERVICE_ACCOUNT_KEY={...}      ← strip key= prefix otomatis
 *   🔧 "{\"type\":\"service_account\",...}"    ← strip extra quotes otomatis
 */

/**
 * Sanitasi raw string env var → JSON string yang siap di-parse.
 * Menangani kesalahan format yang sering terjadi saat set env var di VPS/.env.
 */
function sanitizeServiceAccountKey(raw: string): string {
  let value = raw.trim();

  // Kasus 1: User paste seluruh baris .env → "FIREBASE_SERVICE_ACCOUNT_KEY={...}"
  // Strip apapun sebelum tanda '=' pertama jika value belum dimulai dengan '{'
  if (!value.startsWith("{") && value.includes("=")) {
    const eqIdx = value.indexOf("=");
    value = value.substring(eqIdx + 1).trim();
  }

  // Kasus 2: Value dibungkus dengan tanda kutip tunggal atau ganda → '"{"type":...}"'
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  // Kasus 3: Escaped quotes dari shell → \"type\" menjadi "type"
  // Ini terjadi kalau value di-set via CLI dengan escaping
  if (value.includes('\\"')) {
    value = value.replace(/\\"/g, '"');
  }

  return value;
}

// Initialize Firebase Admin SDK only once (module-level singleton)
if (!admin.apps.length) {
  const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!rawKey) {
    console.warn(
      "[Firebase] ⚠️  FIREBASE_SERVICE_ACCOUNT_KEY belum di-set. " +
        "Push notification tidak akan berfungsi. " +
        "Set di .env (VPS) dengan VALUE berupa JSON murni service account (tanpa nama key).",
    );
  } else {
    try {
      const sanitized = sanitizeServiceAccountKey(rawKey);

      if (!sanitized.startsWith("{")) {
        throw new Error(
          `Value tidak dimulai dengan '{'. Pastikan VALUE di .env adalah JSON murni, bukan "NAMA_KEY=JSON". ` +
            `Karakter pertama yang diterima: '${sanitized.charAt(0)}'`,
        );
      }

      const serviceAccount = JSON.parse(sanitized);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      console.log(
        `[Firebase] ✅ Firebase Admin SDK berhasil diinisialisasi. ` +
          `Project: ${serviceAccount.project_id}`,
      );
    } catch (error: any) {
      console.error(
        "[Firebase] ❌ Gagal inisialisasi Firebase Admin SDK.",
        "\nPenyebab umum:",
        "\n  1. VALUE di .env salah format (harus JSON murni, bukan NAMA_KEY=JSON)",
        "\n  2. JSON tidak valid (ada karakter tambahan)",
        "\nDetail error:",
        error?.message ?? error,
      );
      // Jangan throw — jangan sampai crash build
    }
  }
}

export const getMessaging = (): admin.messaging.Messaging | null => {
  if (admin.apps.length > 0) {
    return admin.messaging();
  }
  return null;
};

export const firebaseAdmin = admin;
