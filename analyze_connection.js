const axios = require('axios');
const io = require('socket.io-client');
const API_URL = 'https://man2man-api.onrender.com';

async function diagnose() {
    console.log('--- DIAGNOSTIC START ---');
    console.log(`Target: ${API_URL}`);

    // 1. API Root Check
    try {
        const res = await axios.get(`${API_URL}/api`, { validateStatus: () => true });
        console.log(`\n[API GET /api]: ${res.status}`);
        console.log(`Headers:`, JSON.stringify(res.headers['access-control-allow-origin'] || 'MISSING'));
    } catch (e) {
        console.error(`[API GET FAIL]: ${e.message}`);
        if (e.response) {
            console.log(`[FAIL HEADERS]:`, JSON.stringify(e.response.headers, null, 2));
            console.log(`[FAIL DATA]:`, JSON.stringify(e.response.data));
        }
    }

    // 2. OPTIONS Preflight Check
    try {
        const res = await axios.options(`${API_URL}/api`, { validateStatus: () => true });
        console.log(`\n[API OPTIONS /api]: ${res.status}`);
        console.log(`CORS Origin Header:`, JSON.stringify(res.headers['access-control-allow-origin']));
        console.log(`CORS Methods Header:`, JSON.stringify(res.headers['access-control-allow-methods']));
    } catch (e) { console.error(`[API OPTIONS FAIL]: ${e.message}`); }

    // 3. Socket Polling Check
    console.log('\n[SOCKET] Testing Polling Handshake...');
    const pollSocket = io(`${API_URL}/system`, {
        transports: ['polling'],
        path: '/socket.io',
        forceNew: true,
        reconnection: false
    });

    pollSocket.on('connect', () => {
        console.log('[SOCKET POLLING] SUCCESS: Connected via Polling');
        pollSocket.disconnect();
    });
    pollSocket.on('connect_error', (err) => {
        console.log(`[SOCKET POLLING] FAIL: ${err.message}`);
        if (err.data) console.log(`Details: ${JSON.stringify(err.data)}`);
    });

    // 4. Socket WebSocket Check
    console.log('\n[SOCKET] Testing WebSocket Upgrade...');
    const wsSocket = io(`${API_URL}/system`, {
        transports: ['websocket'],
        path: '/socket.io',
        forceNew: true,
        reconnection: false
    });

    wsSocket.on('connect', () => {
        console.log('[SOCKET WS] SUCCESS: Connected via WebSocket');
        wsSocket.disconnect();
        // If we get here, connection is perfect
        console.log('\n--- DIAGNOSTIC COMPLETE: FULL SUCCESS ---');
    });
    wsSocket.on('connect_error', (err) => {
        console.log(`[SOCKET WS] FAIL: ${err.message}`);
        // Often gives 'xhr poll error' or 'websocket error'
    });
}

diagnose();
