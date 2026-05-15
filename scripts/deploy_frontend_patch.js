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
    const localFile = path.resolve(__dirname, '../frontend/components/p2p/P2PDashboard.js');
    const remoteFile = '/var/www/man2man/frontend/components/p2p/P2PDashboard.js';
    
    console.log('Reading local P2PDashboard.js...');
    const content = fs.readFileSync(localFile, 'utf8');
    const b64 = Buffer.from(content).toString('base64');
    
    console.log(`Base64 length: ${b64.length}`);
    
    // Clear the remote file first
    SSH(`> /tmp/dashboard_b64.txt`);
    
    // Upload in chunks of 4000 characters to avoid command line length limits
    const chunkSize = 4000;
    for (let i = 0; i < b64.length; i += chunkSize) {
        const chunk = b64.substring(i, i + chunkSize);
        console.log(`Uploading chunk ${i} to ${i + chunk.length}...`);
        SSH(`echo -n '${chunk}' >> /tmp/dashboard_b64.txt`);
    }
    
    console.log('Decoding base64 on VPS...');
    SSH(`base64 -d /tmp/dashboard_b64.txt > ${remoteFile}`);
    
    console.log('Restarting frontend Docker container...');
    SSH(`cd /var/www/man2man && docker compose -f docker-compose.prod.yml up -d --build frontend`);
    
    console.log('Frontend patched successfully.');
} catch (e) {
    console.error('Failed:', e.message);
}
