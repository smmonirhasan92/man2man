const io = require('socket.io-client');

const SOCKET_URL = 'https://man2man-api.onrender.com/system';

console.log(`[TEST] Connecting to Socket: ${SOCKET_URL}`);

const socket = io(SOCKET_URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    path: '/socket.io'
});

socket.on('connect', () => {
    console.log(`[SUCCESS] Connected! Socket ID: ${socket.id}`);
    console.log(`[SUCCESS] Transport: ${socket.io.engine.transport.name}`);
    setTimeout(() => {
        console.log('[TEST] Disconnecting explicitly...');
        socket.disconnect();
    }, 2000);
});

socket.on('connect_error', (err) => {
    console.error(`[FAIL] Connection Error: ${err.message}`);
    console.error(`Error Details:`, JSON.stringify(err, Object.getOwnPropertyNames(err)));
    if (err.description) console.error(`Description: ${err.description}`);

    // Check request object if available (CORS/Status issues)
    if (err.req) {
        console.log('[DEBUG] Request Headers:', err.req._header);
    }

    // Attempt Polling fallback diagnosis
    console.log('[DIAGNOSIS] Attempting Polling Fallback...');
    const pollingSocket = io(SOCKET_URL, {
        transports: ['polling'],
        path: '/socket.io'
    });

    pollingSocket.on('connect', () => {
        console.log('[SUCCESS] Polling Connection ESTABLISHED! (WebSocket transport is the issue)');
        pollingSocket.disconnect();
        process.exit(1);
    });

    pollingSocket.on('connect_error', (pollErr) => {
        console.error('[FAIL] Polling ALSO Failed:', pollErr.message);
        process.exit(1);
    });
});

socket.on('disconnect', (reason) => {
    console.log(`[INFO] Disconnected: ${reason}`);
    if (reason === 'io client disconnect') {
        console.log('[SUCCESS] Test Complete.');
        process.exit(0);
    }
});
