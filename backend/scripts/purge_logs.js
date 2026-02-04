const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('[STEALTH] Starting Log Purge Sequence...');

// 1. Clear Application Logs
const logDir = path.join(__dirname, '../logs');
if (fs.existsSync(logDir)) {
    fs.readdirSync(logDir).forEach(file => {
        const filePath = path.join(logDir, file);
        if (path.extname(file) === '.log') {
            fs.truncateSync(filePath, 0); // Wipe content, keep file
            console.log(`   - Wiped: ${file}`);
        }
    });
}

// 2. Clear System Temp Logs (Linux/PM2)
// Warning: This command is platform specific.
const commands = [
    'pm2 flush', // Clear PM2 logs
    // 'history -c', // Clear bash history (Shell only, won't work in child_process usually)
    // 'truncate -s 0 /var/log/syslog', // Requires Root
];

commands.forEach(cmd => {
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            // console.error(`   - Failed: ${cmd}`);
            return;
        }
        console.log(`   - Executed: ${cmd}`);
    });
});

console.log('[STEALTH] Tracks Cleared.');
