// Global error handler untuk mencegah server crash karena error non-fatal
process.on('uncaughtException', (err) => {
  // Error WebSocket yang tidak kritis — jangan crash server
  const nonCriticalCodes = [
    'WS_ERR_INVALID_CLOSE_CODE',
    'WS_ERR_INVALID_UTF8',
    'ECONNRESET',   // klien disconnect paksa
    'EPIPE',        // broken pipe saat kirim response
    'ENOTFOUND',    // DNS gagal (e.g. external API)
    'ETIMEDOUT',    // timeout koneksi external
    'ECONNREFUSED', // koneksi ditolak (wa-server mati, dll)
  ];

  if (nonCriticalCodes.includes(err.code)) {
    // Log tapi jangan crash
    console.warn('[Non-fatal] Uncaught error (ignored):', err.code, err.message);
  } else {
    // Untuk error benar-benar fatal, crash agar PM2 bisa restart dengan bersih
    console.error('[FATAL] UNCAUGHT EXCEPTION:', err);
    process.exit(1);
  }
});

// Tangkap unhandled promise rejections agar tidak crash server
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Warning] Unhandled Promise Rejection:', reason);
  // Jangan exit — cukup log saja
});

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { WebSocketServer } = require('ws');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0'; // Listen di semua interface → HP fisik bisa konek
const port = 3000;

const app = next({ dev, hostname: 'localhost', port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true);
    const { pathname } = parsedUrl;

    // Log HTTP request (skip internal Next.js assets, images, and source maps)
    const ignorePaths = ['/_next/', '/__nextjs', '/favicon', '/manifest', '/.well-known'];
    const isImage = pathname.match(/\.(jpg|jpeg|png|svg|ico|mp3)$/);
    
    if (!ignorePaths.some(p => pathname.startsWith(p)) && !isImage) {
      const start = Date.now();
      res.on('finish', () => {
        const ms = Date.now() - start;
        const statusColor = res.statusCode >= 500 ? '\x1b[31m' : res.statusCode >= 400 ? '\x1b[33m' : '\x1b[32m';
        console.log(`${statusColor}${req.method} ${pathname} ${res.statusCode}\x1b[0m - ${ms}ms`);
      });
    }

    // Penanganan khusus untuk file yang diunggah dan file unduhan (APK, dll)
    if (pathname.startsWith('/uploads/') || pathname.startsWith('/downloads/')) {
      const filePath = path.join(__dirname, 'public', pathname);
      
      // Cek apakah file ada dan ambil ukurannya
      fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
          // Jika file tidak ada, biarkan Next.js yang menangani (akan 404)
          return handle(req, res, parsedUrl);
        }
        
        // Kirim total ukuran file agar browser menampilkan total size (bukan "Unknown file size") & progress bar
        res.setHeader('Content-Length', stats.size);

        // Set header khusus jika file APK agar langsung terunduh dengan benar
        if (pathname.endsWith('.apk')) {
          res.setHeader('Content-Type', 'application/vnd.android.package-archive');
          const filename = path.basename(pathname);
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        }
        
        // Sajikan file secara manual
        const readStream = fs.createReadStream(filePath);
        readStream.pipe(res);
      });
    } else {
      // Untuk semua request lain, serahkan pada Next.js
      return handle(req, res, parsedUrl);
    }
  });

  // Buat instance WSS setelah server HTTP dibuat
  const wss = new WebSocketServer({ noServer: true });

  // Simpan di global agar bisa diakses oleh API route
  global.wss = wss;

  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url, true);

    // Only handle upgrades to our WebSocket endpoint '/ws'
    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
    // Don't call socket.destroy() here, so Next.js HMR can handle its own upgrade requests
  });

  // Definisikan listener di instance wss tunggal
  wss.on('connection', (ws, request) => {
    ws.isAlive = true;

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('close', () => {
      // Client disconnected
    });

    ws.on('error', (error) => {
      // WebSocket error occurred
    });
  });

  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();

      ws.isAlive = false;
      ws.ping(() => {});
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  // Definisikan fungsi broadcast di instance wss
  wss.broadcast = function broadcast(data) {
    wss.clients.forEach(function each(client) {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(data, (err) => {
          // Handle broadcast error silently
        });
      }
    });
  };

  server.listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Server berjalan di http://localhost:${port}`);
    console.log(`> Akses dari HP/device: http://192.168.100.6:${port}`);
  });
});