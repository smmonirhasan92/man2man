const { spawn } = require('child_process');
const fs = require('fs');

const out = fs.openSync('./debug_out.log', 'w');
const err = fs.openSync('./debug_out.log', 'a');

console.log('Starting server process...');

const server = spawn('node', ['server.js'], {
    stdio: ['ignore', out, err]
});

server.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
});

server.on('error', (err) => {
    console.error('Failed to start server:', err);
});

// Keep this runner alive for a bit to capture early exit
setTimeout(() => {
    console.log('Timeout reached, checking log.');
    // server.kill(); // Don't kill if it's running, but strictly this script is just a launcher wrapper
    // Actually, we want to leave it running if it works. 
    // But if it exits immediately, we want to know.
}, 5000);
