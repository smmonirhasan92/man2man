const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SSH = (cmd) => {
    return execSync(`node scripts/ssh_runner.js "${cmd.replace(/"/g, '\\"')}"`, {
        cwd: path.resolve(__dirname, '..'),
        encoding: 'utf8'
    });
};

try {
    const localFile = path.resolve(__dirname, '../frontend/app/admin/dashboard/page.js');
    const remoteFile = '/var/www/man2man/frontend/app/admin/dashboard/page.js';
    
    console.log('Uploading Admin Dashboard page...');
    const content = fs.readFileSync(localFile, 'utf8');
    const b64 = Buffer.from(content).toString('base64');
    
    SSH(`> /tmp/dashboard_b64.txt`);
    
    const chunkSize = 4000;
    for (let i = 0; i < b64.length; i += chunkSize) {
        const chunk = b64.substring(i, i + chunkSize);
        SSH(`echo -n '${chunk}' >> /tmp/dashboard_b64.txt`);
    }
    
    console.log('Decoding on VPS...');
    SSH(`base64 -d /tmp/dashboard_b64.txt > ${remoteFile}`);
    
    console.log('Rebuilding frontend container...');
    SSH(`cd /var/www/man2man && docker compose -f docker-compose.prod.yml up -d --build frontend`);
    
    console.log('✅ Admin Dashboard deployed successfully!');
} catch (e) {
    console.error('Failed:', e.message);
}
