const { io } = require('socket.io-client');

const socket = io('http://localhost:5050/system');

socket.on('connect', () => {
    console.log('Connected to /system');
    socket.emit('chat_message', { message: 'Hello' });
});

socket.on('chat_response', (data) => {
    console.log('RESPONSE:', data);
    process.exit(0);
});

socket.on('connect_error', (err) => {
    console.error('Connection Error:', err);
    process.exit(1);
});

// Timeout
setTimeout(() => {
    console.log('Timeout');
    process.exit(1);
}, 10000);
