const { spawn } = require('child_process');
const fs = require('fs');

const server = spawn('node', ['backend/server.js'], { cwd: 'd:/man2man' });

const logStream = fs.createWriteStream('crash.log');

server.stdout.pipe(logStream);
server.stderr.pipe(logStream);

server.on('close', (code) => {
    console.log(`Server exited with code ${code}`);
    process.exit(0);
});
