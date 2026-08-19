const express = require('express');
const cors = require('cors');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

let sock;
let currentQR = '';
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY_MS = 30000; // max 30 detik

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('sessions');
    
    sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true, // You can still print to terminal for debugging
        browser: Browsers.macOS('Desktop'), // Use built-in Browsers config
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            // Generate QR base64 so it can be accessed via API
            try {
                currentQR = await QRCode.toDataURL(qr);
            } catch (err) {
                console.error("Failed to generate QR data URL", err);
            }
        }

        if (connection === 'close') {
            isConnected = false;
            currentQR = '';
            const statusCode = lastDisconnect.error?.output?.statusCode;
            // 403 = Forbidden (biasanya karena nomor WA diblokir/banned)
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut && statusCode !== 403;
            console.log('Connection closed due to', lastDisconnect.error?.message, ', reconnecting:', shouldReconnect);
            
            // Reconnect dengan exponential backoff agar tidak infinite loop
            if (shouldReconnect) {
                reconnectAttempts++;
                // Delay: 2s, 4s, 8s, 16s, max 30s
                const delay = Math.min(2000 * Math.pow(2, reconnectAttempts - 1), MAX_RECONNECT_DELAY_MS);
                console.log(`Reconnecting in ${delay / 1000}s (attempt #${reconnectAttempts})...`);
                setTimeout(connectToWhatsApp, delay);
            } else {
                console.log('Logged out. Clearing sessions folder and restarting to re-scan QR...');
                try {
                    fs.rmSync('sessions', { recursive: true, force: true });
                } catch (e) {
                    console.error('Failed to clear sessions:', e);
                }
                setTimeout(connectToWhatsApp, 2000);
            }
        } else if (connection === 'open') {
            isConnected = true;
            currentQR = '';
            reconnectAttempts = 0; // reset counter kalau berhasil konek
            console.log('WhatsApp connection opened successfully!');
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

// Start WhatsApp connection
connectToWhatsApp();

// --- API Endpoints ---

// 1. Get QR Code for login
app.get('/qr', (req, res) => {
    if (isConnected) {
        return res.status(200).json({ status: 'connected', message: 'WhatsApp is already connected.' });
    }
    if (currentQR) {
        // Send a simple HTML page with the image to make it easy to scan from browser
        res.send(`
            <html>
                <head><title>WhatsApp QR Login</title></head>
                <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
                    <h2>Scan this QR Code with your WhatsApp</h2>
                    <img src="${currentQR}" alt="WhatsApp QR Code" />
                    <script>
                        // Auto refresh page every 5 seconds to get new QR or status
                        setTimeout(() => window.location.reload(), 5000);
                    </script>
                </body>
            </html>
        `);
    } else {
        res.status(200).json({ status: 'loading', message: 'QR Code is not ready yet or already connected.' });
    }
});

// 1.5 Get QR Code API
app.get('/api/qr', (req, res) => {
    if (isConnected) {
        return res.status(200).json({ status: 'connected' });
    }
    if (currentQR) {
        return res.status(200).json({ status: 'ready', qr: currentQR });
    }
    return res.status(200).json({ status: 'loading' });
});

// 2. Check connection status
app.get('/status', (req, res) => {
    res.json({
        status: isConnected ? 'connected' : 'disconnected',
        hasQr: !!currentQR
    });
});

// 3. Send message
app.post('/send', async (req, res) => {
    if (!isConnected || !sock) {
        return res.status(503).json({ success: false, error: 'WhatsApp is not connected yet.' });
    }

    const { target, message } = req.body;
    
    if (!target || !message) {
        return res.status(400).json({ success: false, error: 'Target and message are required.' });
    }

    // Format phone number to WhatsApp JID
    let targetPhone = target.replace(/\D/g, "");
    if (targetPhone.startsWith("0")) {
        targetPhone = "62" + targetPhone.substring(1);
    }
    const jid = targetPhone + '@s.whatsapp.net';

    try {
        const result = await sock.sendMessage(jid, { text: message });
        res.json({ success: true, result });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 4. Logout API
app.post('/logout', async (req, res) => {
    try {
        if (sock && isConnected) {
            await sock.logout();
        }
    } catch (e) {
        console.error('Logout error:', e);
    } finally {
        isConnected = false;
        currentQR = '';
        console.log('Clearing sessions manually via /logout API...');
        try {
            fs.rmSync('sessions', { recursive: true, force: true });
        } catch (err) {
            console.error('Failed to clear sessions via /logout API', err);
        }
        res.json({ success: true, message: 'Sessions cleared and logged out' });
        
        // Restart connection after clearing
        reconnectAttempts = 0;
        setTimeout(connectToWhatsApp, 1000);
    }
});

app.listen(PORT, () => {
    console.log(`WhatsApp Server is running on http://localhost:${PORT}`);
    console.log(`Check QR code at http://localhost:${PORT}/qr`);
});
