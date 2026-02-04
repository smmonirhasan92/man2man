const fs = require('fs');
const path = require('path');

const ROOT_DIRS = [
    path.join(__dirname, '../backend'),
    path.join(__dirname, '../frontend/public'),
    path.join(__dirname, '../frontend/app')
];

const BLANK_HTML = '<!DOCTYPE html><html><head><title>Access Denied</title></head><body></body></html>';

function secureDirectory(dir) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);

    // Check/Create index.html
    const indexFile = path.join(dir, 'index.html');
    if (!fs.existsSync(indexFile)) {
        fs.writeFileSync(indexFile, BLANK_HTML);
        console.log(`🔒 Secured: ${dir}`);
    }

    // Recurse
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory() && file !== 'node_modules' && file !== '.git') {
            secureDirectory(fullPath);
        }
    });
}

console.log('🛡️ Starting Directory Security Scan...');
ROOT_DIRS.forEach(dir => secureDirectory(dir));
console.log('✅ All directories secured.');
