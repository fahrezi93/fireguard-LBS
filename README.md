# SiagaBencana - Sistem Pelaporan Kebakaran

Aplikasi web untuk pelaporan dan monitoring kebakaran real-time dengan fitur peta interaktif dan routing cerdas.

## Fitur Utama

- 🔥 Pelaporan kebakaran real-time dengan foto
- 🗺️ Peta interaktif dengan routing OSRM
- 🚒 Deteksi pos pemadam terdekat otomatis
- 📊 Dashboard admin untuk monitoring
- 📱 Responsive design (Mobile & Desktop)
- ✅ Tracking status laporan

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MySQL
- **Maps**: Leaflet, React-Leaflet, OSRM
- **Authentication**: Custom JWT-based auth

## Environment Variables

Buat file `.env` atau `.env.local` dengan mengacu ke `.env.example`.

Variabel penting untuk production:

```env
MYSQL_HOST=your-db-host
MYSQL_PORT=3306
MYSQL_USER=your-db-user
MYSQL_PASSWORD=your-db-password
MYSQL_DATABASE=siagabencana

JWT_SECRET=your-super-secret-jwt-key
OTP_HASH_SECRET=your-super-secret-otp-key
AUTH_OTP_LOGIN_FALLBACK=true

GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password

NEXT_PUBLIC_BASE_URL=https://your-domain.com
NODE_ENV=production

ANDROID_PACKAGE_NAME=com.yourcompany.siagabencana
ANDROID_SHA256_CERT_FINGERPRINT=AA:BB:CC:...
```

## Instalasi

1. Clone repository:
```bash
git clone https://github.com/fahrezi93/siagabencana-LBS.git
cd siagabencana-LBS
```

2. Install dependencies:
```bash
npm install
```

3. Setup database:
```bash
# Jalankan migrasi database (jika ada)
npm run db:migrate
```

4. Jalankan development server:
```bash
npm run dev
```

5. Buka [http://localhost:3000](http://localhost:3000)

## Build APK/AAB via TWA (Play Store)

### 1) Siapkan domain production HTTPS

- Deploy aplikasi ke domain final (misalnya `https://app.siagabencana.id`).
- Pastikan endpoint ini bisa diakses:
   - `https://your-domain.com/manifest.json`
   - `https://your-domain.com/.well-known/assetlinks.json`

### 2) Generate Digital Asset Links

Set env berikut:

- `ANDROID_PACKAGE_NAME` -> package Android final (contoh `com.sipilip.siagabencana`)
- `ANDROID_SHA256_CERT_FINGERPRINT` -> SHA-256 dari Play App Signing certificate

Lalu generate file otomatis:

```bash
npm run assetlinks:generate
```

Script akan menulis ke `public/.well-known/assetlinks.json`.

### 3) Verifikasi asset links

Gunakan API verifier Google:

```bash
curl "https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://your-domain.com&relation=delegate_permission/common.handle_all_urls"
```

### 4) Build Android (Bubblewrap)

Contoh alur singkat:

```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://your-domain.com/manifest.json
bubblewrap build
```

Output bisa berupa APK (testing) dan AAB (Play Store submission).

## Deploy ke Vercel

### Langkah 1: Push ke GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Langkah 2: Deploy di Vercel

1. Buka [vercel.com](https://vercel.com)
2. Login dengan GitHub
3. Klik "New Project"
4. Import repository `fahrezi93/siagabencana-LBS`
5. Tambahkan Environment Variables:
   - `MYSQL_HOST`
   - `MYSQL_PORT`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_DATABASE`
   - `JWT_SECRET`
   - `OTP_HASH_SECRET`
   - `NEXT_PUBLIC_BASE_URL`
   - `ANDROID_PACKAGE_NAME` (untuk generate assetlinks)
   - `ANDROID_SHA256_CERT_FINGERPRINT` (untuk generate assetlinks)
6. Klik "Deploy"

### Environment Variables untuk Production

```
MYSQL_HOST=your-db-host
MYSQL_PORT=3306
MYSQL_USER=your-db-user
MYSQL_PASSWORD=your-db-password
MYSQL_DATABASE=siagabencana

JWT_SECRET=generate-random-32-byte-secret
OTP_HASH_SECRET=generate-random-32-byte-secret
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app

ANDROID_PACKAGE_NAME=com.yourcompany.siagabencana
ANDROID_SHA256_CERT_FINGERPRINT=AA:BB:CC:...
```

## Struktur Project

```
siagabencana/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API Routes
│   │   ├── dashboard/    # User Dashboard
│   │   ├── operator/     # Admin Dashboard
│   │   └── report/       # Report Pages
│   ├── components/       # React Components
│   ├── lib/              # Utilities & Helpers
│   └── hooks/            # Custom React Hooks
├── public/               # Static Assets
└── prisma/              # Database Schema (if using Prisma)
```

## Scripts

- `npm run dev` - Jalankan development server
- `npm run build` - Build untuk production
- `npm run start` - Jalankan production server
- `npm run lint` - Jalankan ESLint
- `npm run assetlinks:generate` - Generate `public/.well-known/assetlinks.json` dari environment variable

## Fitur Detail

### Untuk User (Pelapor)
- Buat laporan kebakaran dengan foto
- Tandai lokasi di peta
- Lihat estimasi waktu bantuan
- Track status laporan

### Untuk Admin (Operator)
- Dashboard monitoring real-time
- Lihat semua laporan di peta
- Update status laporan
- Lihat rute dari pos damkar ke lokasi

## Kontribusi

Pull requests are welcome! Untuk perubahan besar, silakan buka issue terlebih dahulu.

## License

MIT

## Author

Fahrezi - [GitHub](https://github.com/fahrezi93)
