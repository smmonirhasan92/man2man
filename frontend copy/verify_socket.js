
const io = require('socket.io-client');
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://man2man-api.onrender.com';
const socket = io(BASE_URL + '/system', { transports: ['websocket'] });

console.log('Attempting Connection...');

socket.on('connect', () => {
    console.log('SOCKET_CONNECTED_SUCCESSFULLY');
    process.exit(0);
});

socket.on('connect_error', (err) => {
    console.error('SOCKET_ERROR:', err.message);
    process.exit(1);
});

setTimeout(() => {
    console.error('SOCKET_TIMEOUT');
    process.exit(1);
}, 5000);
