const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, 'new_wd.js'), 'utf8');

// Use ssh_runner.js to run a command. We will pass the content as a base64 string to avoid escaping issues
const base64Content = Buffer.from(content).toString('base64');

const cmd = `node scripts/ssh_runner.js "echo '${base64Content}' | base64 -d > /var/www/man2man/backend/modules/wallet/withdrawal.controller.js"`;

console.log('Uploading file...');
try {
    const result = execSync(cmd, { cwd: 'd:\\man2man_v2-VPS -- Meror', encoding: 'utf8' });
    console.log('Upload success:', result);
} catch (err) {
    console.error('Upload failed:', err.stdout || err.message);
}
