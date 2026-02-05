const io = require('socket.io-client');

// Target the exact namespace used in frontend
const SOCKET_URL = 'https://man2man-api.onrender.com/system';

console.log(`[TEST] Initiating Strict WebSocket Handshake to: ${SOCKET_URL}`);

const socket = io(SOCKET_URL, {
    transports: ['polling', 'websocket'], // Allow polling for test
    path: '/socket.io',
    reconnection: true,
    reconnectionAttempts: 3
});

let connectCount = 0;

socket.on('connect', () => {
    connectCount++;
    console.log(`[PASS] Handshake Successful! (Attempt ${connectCount})`);
    console.log(`[INFO] Socket ID: ${socket.id}`);
    console.log(`[INFO] Transport: ${socket.io.engine.transport.name} (Should be 'websocket')`);

    // Simulate activity
    console.log('[TEST] Sending ping...');
    const start = Date.now();
    socket.emit('ping', (response) => {
        console.log(`[PASS] Pong received in ${Date.now() - start}ms`);
    });

    if (connectCount < 5) {
        console.log(`[TEST] Simulating Refresh/Disconnect in 1s...`);
        setTimeout(() => {
            socket.disconnect();
            console.log('[INFO] Disconnected. Reconnecting...');
            socket.connect();
        }, 1000);
    } else {
        console.log('[SUCCESS] Stability Test Complete (5 Refreshes Passed).');
        socket.disconnect();
        process.exit(0);
    }
});

socket.on('connect_error', (err) => {
    console.error(`[FAIL] Connection Error: ${err.message}`);
    // Extract precise reason code/description if available
    const reason = err.description || err.message;
    console.error(`[FAIL] Reason Code: ${reason}`);

    if (err.context) {
        console.error(`[FAIL] Context: ${JSON.stringify(err.context)}`);
    }

    // If status is 400/404/403, it's a handshake rejection (CORS or Bad Request)
    // If it's "websocket error", it might be network blocking.
    process.exit(1);
});

socket.on('disconnect', (reason) => {
    console.log(`[INFO] Socket Disconnected: ${reason}`);
});
