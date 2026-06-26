# Panduan Deployment SiagaBencana ke VPS (Rocky Linux 8 / RHEL-based)

Dokumen ini berisi panduan lengkap untuk melakukan deployment aplikasi **SiagaBencana** ke Virtual Private Server (VPS) yang menggunakan sistem operasi **Rocky Linux 8** (seperti Jagoan Hosting) dan mengonfigurasi domain `siagabencana.cloud`.

---

## 1. Persiapan Awal di Server (Setelah Login SSH)
Jalankan perintah berikut untuk memperbarui paket sistem di Rocky Linux 8:
```bash
sudo dnf update -y
```

---

## 2. Install Git & Node.js (v20 LTS)
Rocky Linux 8 menggunakan `dnf`. Kita akan menginstal Git dan Node.js v20.

### Langkah 2.1: Install Git
```bash
sudo dnf install git -y
```

### Langkah 2.2: Install Node.js v20
Gunakan NodeSource RPM untuk menginstal Node.js versi modern (v20):
```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install nodejs -y
# Verifikasi instalasi
node -v
npm -v
```

---

## 3. Install & Jalankan MySQL Server
Jika database MySQL di-host di VPS yang sama dengan aplikasi web:
```bash
sudo dnf install mysql-server -y
sudo systemctl start mysqld
sudo systemctl enable mysqld
```

### Konfigurasi Database:
1. Masuk ke console MySQL:
   ```bash
   sudo mysql
   ```
2. Buat database dan user baru untuk aplikasi SiagaBencana:
   ```sql
   CREATE DATABASE siagabencana;
   CREATE USER 'siaga_user'@'localhost' IDENTIFIED BY 'PasswordKuatAnda123!';
   GRANT ALL PRIVILEGES ON siagabencana.* TO 'siaga_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

---

## 4. Clone Repository & Setup Project
1. Masuk ke folder `/var/www` (buat folder jika belum ada):
   ```bash
   sudo mkdir -p /var/www
   cd /var/www
   ```
2. Clone repository Anda (sesuaikan dengan URL repo Anda):
   ```bash
   sudo git clone https://github.com/username/siagabencana-LBS.git siagabencana
   sudo chown -R root:root siagabencana
   cd siagabencana
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Salin file environment:
   ```bash
   cp .env.example .env
   vi .env
   ```
   *(Tekan tombol `I` pada keyboard untuk mengedit. Setelah selesai mengedit, tekan `Esc`, ketik `:wq` lalu tekan `Enter` untuk menyimpan dan keluar).*
   
   *Sesuaikan konfigurasi database (`MYSQL_HOST=localhost`, `MYSQL_USER=siaga_user`, `MYSQL_PASSWORD=PasswordKuatAnda123!`, `MYSQL_DATABASE=siagabencana`) dan variabel lainnya.*

5. Jalankan migrasi database:
   ```bash
   node scripts/setup-db.mjs
   ```

---

## 5. Build Project & Jalankan dengan PM2
Agar Next.js berjalan terus di background meskipun terminal SSH ditutup:
1. Build aplikasi:
   ```bash
   npm run build
   ```
2. Install **PM2** secara global:
   ```bash
   sudo npm install -y pm2 -g
   ```
3. Jalankan aplikasi menggunakan PM2 melalui script `server.js` (karena aplikasi menggunakan custom server untuk WebSockets):
   ```bash
   pm2 start server.js --name "siagabencana" --env NODE_ENV=production
   ```
4. Konfigurasikan autostart saat server reboot:
   ```bash
   pm2 startup
   # Jalankan perintah sudo env PATH=... yang dikeluarkan dari output perintah di atas
   pm2 save
   ```

---

## 6. Install & Konfigurasi Nginx
Next.js berjalan di port 3000. Kita butuh Nginx sebagai reverse proxy agar bisa diakses lewat port 80 (HTTP) dan 443 (HTTPS).

### Langkah 6.1: Install Nginx
```bash
sudo dnf install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Langkah 6.2: Konfigurasi Virtual Host Nginx
1. Buat file konfigurasi baru untuk aplikasi:
   ```bash
   sudo vi /etc/nginx/conf.d/siagabencana.conf
   ```
2. Isi file tersebut dengan konfigurasi berikut:
   ```nginx
   server {
       listen 80;
       server_name siagabencana.cloud www.siagabencana.cloud;

       # WebSocket Endpoint (Penting untuk Fitur Laporan Kebakaran Real-time)
       location /ws {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_cache_bypass $http_upgrade;
           proxy_read_timeout 86400s;
           proxy_send_timeout 86400s;
       }

       # Main App (Next.js)
       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
3. Uji dan restart Nginx:
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### Langkah 6.3: Atur SELinux & Firewall (Penting untuk Rocky Linux)
Rocky Linux memiliki SELinux dan Firewall aktif secara default yang dapat memblokir Nginx terhubung ke Next.js (port 3000) atau akses port 80/443 dari luar.
1. Izinkan Nginx melakukan koneksi ke port lokal (Next.js):
   ```bash
   sudo setsebool -P httpd_can_network_connect 1
   ```
2. Izinkan port HTTP dan HTTPS di Firewall:
   ```bash
   sudo firewall-cmd --permanent --zone=public --add-service=http
   sudo firewall-cmd --permanent --zone=public --add-service=https
   sudo firewall-cmd --reload
   ```

---

## 7. Setup SSL Let's Encrypt (HTTPS)
Aplikasi Next.js & Flutter membutuhkan HTTPS agar fitur GPS/PWA berjalan lancar:
1. Pasang repositori EPEL (diperlukan untuk Certbot di RHEL/Rocky):
   ```bash
   sudo dnf install epel-release -y
   ```
2. Install Certbot Nginx:
   ```bash
   sudo dnf install certbot python3-certbot-nginx -y
   ```
3. Dapatkan sertifikat SSL:
   ```bash
   sudo certbot --nginx -d siagabencana.cloud -d www.siagabencana.cloud
   ```
   *Ikuti instruksi di layar, masukkan email kamu, pilih `Y` untuk menyetujui terms, dan pilih redirect HTTP ke HTTPS jika ditanyakan.*
4. Restart Nginx jika diperlukan:
   ```bash
   sudo systemctl restart nginx
   ```
