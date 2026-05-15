const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SSH = (cmd) => {
    return execSync(`node scripts/ssh_runner.js "${cmd.replace(/"/g, '\\"')}"`, {
        cwd: path.resolve(__dirname, '..'),
        encoding: 'utf8'
    });
};

const deployFile = (localPath, remotePath) => {
    console.log(`Deploying ${localPath} to ${remotePath}...`);
    const content = fs.readFileSync(path.resolve(__dirname, '..', localPath), 'utf8');
    const b64 = Buffer.from(content).toString('base64');
    
    SSH(`> /tmp/deploy_email_b64.txt`);
    
    const chunkSize = 4000;
    for (let i = 0; i < b64.length; i += chunkSize) {
        const chunk = b64.substring(i, i + chunkSize);
        SSH(`echo -n '${chunk}' >> /tmp/deploy_email_b64.txt`);
    }
    
    SSH(`base64 -d /tmp/deploy_email_b64.txt > ${remotePath}`);
    console.log(`✅ ${localPath} deployed.`);
};

try {
    deployFile('backend/modules/auth/EmailService.js', '/var/www/man2man/backend/modules/auth/EmailService.js');
    
    console.log('Restarting backend...');
    SSH(`cd /var/www/man2man && docker compose -f docker-compose.prod.yml restart backend`);
    
    console.log('✅ Email Service deployed successfully!');
} catch (e) {
    console.error('Failed:', e.message);
}
