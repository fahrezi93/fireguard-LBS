const express = require('express');
const cors = require('cors');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');

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
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed due to', lastDisconnect.error?.message, ', reconnecting:', shouldReconnect);
            
            // Reconnect dengan exponential backoff agar tidak infinite loop
            if (shouldReconnect) {
                reconnectAttempts++;
                // Delay: 2s, 4s, 8s, 16s, max 30s
                const delay = Math.min(2000 * Math.pow(2, reconnectAttempts - 1), MAX_RECONNECT_DELAY_MS);
                console.log(`Reconnecting in ${delay / 1000}s (attempt #${reconnectAttempts})...`);
                setTimeout(connectToWhatsApp, delay);
            } else {
                console.log('Logged out. Delete the sessions folder and restart to re-scan QR.');
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

app.listen(PORT, () => {
    console.log(`WhatsApp Server is running on http://localhost:${PORT}`);
    console.log(`Check QR code at http://localhost:${PORT}/qr`);
});
