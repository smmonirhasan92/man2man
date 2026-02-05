const axios = require('axios');
const io = require('socket.io-client');

const BASE_URL = 'https://man2man-api.onrender.com';
const CHECK_INTERVAL = 5000; // 5 seconds
const MAX_ATTEMPTS = 120; // 10 minutes total

async function checkHealth(attempt) {
    try {
        console.log(`[ATTEMPT ${attempt}] Checking ${BASE_URL}/health ...`);
        const res = await axios.get(`${BASE_URL}/health`, { validateStatus: () => true });

        if (res.status === 200) {
            console.log(`\n✅ [SUCCESS] Backend is LIVE! Status: 200 OK`);
            console.log(`Payload: ${JSON.stringify(res.data)}`);
            return true;
        } else {
            console.log(`[WAITING] Status: ${res.status} (Not Ready yet)`);
            return false;
        }
    } catch (error) {
        console.log(`[WAITING] Connection Failed: ${error.message}`);
        return false;
    }
}

function checkSocket() {
    console.log(`\n[SOCKET] Verifying /system handshake...`);
    return new Promise((resolve) => {
        const socket = io(`${BASE_URL}/system`, {
            transports: ['polling', 'websocket'], // Matching new config
            path: '/socket.io',
            reconnection: false
        });

        socket.on('connect', () => {
            console.log(`✅ [SUCCESS] Socket Connected! ID: ${socket.id}`);
            console.log(`Transport: ${socket.io.engine.transport.name}`);
            socket.disconnect();
            resolve(true);
        });

        socket.on('connect_error', (err) => {
            console.error(`❌ [FAIL] Socket Error: ${err.message}`);
            resolve(false);
        });
    });
}

async function monitor() {
    console.log(`Starting Deployment Monitor for ${BASE_URL}...`);

    for (let i = 1; i <= MAX_ATTEMPTS; i++) {
        const isLive = await checkHealth(i);
        if (isLive) {
            console.log(`\n--- Backend is Ready. Checking Socket ---`);
            await checkSocket();
            process.exit(0);
        }
        await new Promise(r => setTimeout(r, CHECK_INTERVAL));
    }

    console.log('\n[TIMEOUT] Deployment did not become ready within 2 minutes.');
    process.exit(1);
}

monitor();
