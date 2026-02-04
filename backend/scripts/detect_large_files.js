const fs = require('fs');
const path = require('path');

const ROOT = 'd:/man2man';
const LIMIT = 50 * 1024 * 1024; // 50MB
const IGNORE_DIRS = ['node_modules', '.git'];

function scan(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (IGNORE_DIRS.includes(file)) continue;
        const fullPath = path.join(dir, file);
        try {
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                scan(fullPath);
            } else {
                if (stat.size > LIMIT) {
                    console.log(`[LARGE] ${fullPath} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
                }
            }
        } catch (e) {
            // Permission denied etc
        }
    }
}

console.log('Scanning for files > 50MB...');
scan(ROOT);
console.log('Scan complete.');
