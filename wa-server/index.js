const express = require('express');
const cors = require('cors');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

let sock;
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY_MS = 30000; // max 30 detik

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('sessions');
    const version = [2, 3000, 1015901307];
    console.log(`Using WhatsApp v${version.join('.')}`);
    
    sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false, // Turn off QR
        browser: Browsers.macOS('Desktop'), // Use built-in Browsers config
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            isConnected = false;
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
            reconnectAttempts = 0; // reset counter kalau berhasil konek
            console.log('WhatsApp connection opened successfully!');
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

// Start WhatsApp connection
connectToWhatsApp();

// --- API Endpoints ---

// 1. Pairing Code API
app.post('/api/pairing', async (req, res) => {
    if (isConnected) {
        return res.status(200).json({ success: false, message: 'WhatsApp is already connected.' });
    }
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
        return res.status(400).json({ success: false, message: 'Phone number is required.' });
    }
    try {
        if (!sock) {
            return res.status(503).json({ success: false, message: 'WhatsApp Socket is not initialized yet.' });
        }
        if (!sock.authState.creds.registered) {
            let targetPhone = phoneNumber.replace(/\D/g, "");
            if (targetPhone.startsWith("0")) {
                targetPhone = "62" + targetPhone.substring(1);
            }
            
            let code = null;
            let retries = 5;
            let lastError = null;
            
            while (retries > 0) {
                try {
                    code = await sock.requestPairingCode(targetPhone);
                    break;
                } catch (err) {
                    lastError = err;
                    if (err.message === 'Connection Closed') {
                        console.log('Socket closed during pairing request, retrying in 2s...');
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        retries--;
                    } else {
                        throw err;
                    }
                }
            }
            
            if (code) {
                return res.status(200).json({ success: true, code });
            } else {
                return res.status(500).json({ success: false, message: 'Server masih mencoba terhubung. Silakan coba klik tombol lagi dalam 5 detik.' });
            }
        } else {
            return res.status(200).json({ success: false, message: 'Already registered or connected.' });
        }
    } catch (err) {
        console.error('Failed to request pairing code:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// 2. Check connection status
app.get('/status', (req, res) => {
    res.json({
        status: isConnected ? 'connected' : 'disconnected'
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
    console.log(`Use POST /api/pairing to get pairing code`);
});
