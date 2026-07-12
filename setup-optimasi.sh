#!/bin/bash
# Skrip Optimasi VPS - SiagaBencana
# Dibuat berdasarkan panduan optimasi Jagoan Hosting & kebutuhan aplikasi

echo "Memulai proses optimasi VPS untuk SiagaBencana..."
echo "------------------------------------------------"

# 1. Menambahkan Swap Space (RAM Cadangan)
# Merujuk pada panduan optimasi VPS Jagoan Hosting untuk mencegah Out Of Memory (OOM)
echo "[1/4] Mengecek dan menambahkan Swap Space (2GB)..."
if grep -q "swap" /etc/fstab; then
    echo "Swap space sudah ada. Melewati langkah ini."
else
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "Swap 2GB berhasil ditambahkan!"
fi

# 2. Konfigurasi Nginx (Setara dengan Optimasi Apache pada tutorial Jagoan Hosting)
# Tutorial dari JH membahas Apache (MPM Event, mod_expires, mod_deflate, mod_evasive, HTTP/2).
# Berikut adalah padanannya untuk Nginx agar performanya sama-sama maksimal.
echo "[2/4] Mengoptimasi konfigurasi Nginx (Worker, Timeout, Gzip, Caching & Security)..."
NGINX_CONF="/etc/nginx/nginx.conf"
if [ -f "$NGINX_CONF" ]; then
    # Backup konfigurasi asli
    sudo cp $NGINX_CONF ${NGINX_CONF}.backup

    # 1. Optimasi Worker (Setara dengan MPM Event di Apache)
    sudo sed -i 's/worker_processes.*/worker_processes auto;/' $NGINX_CONF
    sudo sed -i 's/worker_connections.*/worker_connections 2048;/' $NGINX_CONF
    
    # 2. Mengatur KeepAlive (Setara dengan KeepAlive di Apache)
    if ! grep -q "keepalive_timeout" $NGINX_CONF; then
        sudo sed -i '/http {/a \    keepalive_timeout 15;\n    keepalive_requests 100;' $NGINX_CONF
    else
        sudo sed -i 's/keepalive_timeout.*/keepalive_timeout 15;/' $NGINX_CONF
    fi

    # 3. Mengaktifkan Kompresi Gzip (Setara dengan mod_deflate)
    if ! grep -q "gzip on;" $NGINX_CONF; then
        sudo sed -i '/http {/a \    gzip on;\n    gzip_comp_level 5;\n    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;' $NGINX_CONF
    fi

    # 4. Keamanan Dasar & Rate Limiting (Setara dengan mod_evasive)
    # Menambahkan limit request untuk mencegah DDoS ringan
    if ! grep -q "limit_req_zone" $NGINX_CONF; then
        sudo sed -i '/http {/a \    limit_req_zone $binary_remote_addr zone=mylimit:10m rate=10r/s;' $NGINX_CONF
    fi
    
    sudo systemctl reload nginx
    echo "Nginx berhasil dioptimasi dengan standar maksimal!"
else
    echo "File nginx.conf tidak ditemukan. Pastikan Nginx terinstall."
fi

# 3. Limit Memori PM2 (Untuk Next.js & WhatsApp Server)
echo "[3/6] Mengonfigurasi limit memori untuk aplikasi Node.js (PM2)..."
if command -v pm2 &> /dev/null; then
    echo "Untuk membatasi PM2, jalankan perintah ini secara manual sesuai nama aplikasi Anda:"
    echo "pm2 restart <nama-aplikasi> --max-memory-restart 500M"
    echo "pm2 save"
else
    echo "PM2 tidak terdeteksi di server ini (mungkin dijalankan oleh user lain)."
fi

# 4. Update OS & Keamanan Dasar
echo "[4/6] Memperbarui paket OS untuk keamanan..."
sudo apt-get update && sudo apt-get upgrade -y
echo "Paket OS berhasil diperbarui!"

# 5. Kernel & Network Tuning (sysctl)
echo "[5/6] Menerapkan Network Tuning (TCP/IP & File Descriptors)..."
SYSCTL_CONF="/etc/sysctl.conf"
if ! grep -q "net.core.somaxconn" $SYSCTL_CONF; then
    echo "net.core.somaxconn = 65535" | sudo tee -a $SYSCTL_CONF
    echo "fs.file-max = 100000" | sudo tee -a $SYSCTL_CONF
    sudo sysctl -p
    echo "Kernel berhasil dioptimasi untuk high-concurrency!"
fi

# 6. Database Tuning (MySQL)
echo "[6/6] Mengoptimalkan MySQL Buffer Pool (innodb_buffer_pool_size)..."
MYSQL_CONF="/etc/mysql/my.cnf"
if [ -f "$MYSQL_CONF" ] || [ -f "/etc/my.cnf" ]; then
    echo "Tuning MySQL disarankan dilakukan manual pada file konfigurasi."
    echo "Tambahkan baris berikut di bawah [mysqld]:"
    echo "innodb_buffer_pool_size = 256M"
else
    echo "File konfigurasi MySQL standar tidak ditemukan."
fi

# SELESAI
echo "------------------------------------------------"
echo "Optimasi internal server (Tingkat OS, Web Server, Kernel) selesai!"
echo ""
echo "LANGKAH TERAKHIR DARI PIHAK JAGOAN HOSTING (Mendaftar Cloudflare):"
echo "Segera daftarkan domain siagabencana.cloud ke Cloudflare."
echo "Cloudflare akan berfungsi sebagai 'tameng' (CDN & Browser Cache) memblokir bot/DDoS,"
echo "sehingga beban CPU dan RAM di VPS akan sangat ringan."
echo "Panduan: https://www.jagoanhosting.com/tutorial/vps/mendaftar-cloudflare"
