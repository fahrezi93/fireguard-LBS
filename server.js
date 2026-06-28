// Global error handler untuk mencegah server crash karena error spesifik dari WebSocket
process.on('uncaughtException', (err) => {
  // Di mode development, beberapa error WebSocket yang tidak kritis bisa muncul karena hot-reloading.
  // Kita tangkap di sini agar server tidak crash.
  const isDev = process.env.NODE_ENV !== 'production';
  const nonCriticalErrors = ['WS_ERR_INVALID_CLOSE_CODE', 'WS_ERR_INVALID_UTF8'];

  if (isDev && nonCriticalErrors.includes(err.code)) {
    // Ignore non-critical WebSocket errors during hot-reloading
  } else {
    // Untuk error lainnya, biarkan server crash agar kita tahu ada masalah serius
    console.error('UNCAUGHT EXCEPTION:', err);
    process.exit(1);
  }
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

    // Penanganan khusus untuk file yang diunggah
    if (pathname.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, 'public', pathname);
      
      // Cek apakah file ada sebelum menyajikannya
      fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
          // Jika file tidak ada, biarkan Next.js yang menangani (akan 404)
          return handle(req, res, parsedUrl);
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