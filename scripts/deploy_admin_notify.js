const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const SSH = (cmd) => execSync(`node scripts/ssh_runner.js "${cmd.replace(/"/g, '\\"')}"`, { cwd: root, encoding: 'utf8' });

const deployFile = (localPath, remotePath) => {
    console.log(`Uploading ${localPath}...`);
    const content = fs.readFileSync(path.resolve(root, localPath), 'utf8');
    const b64 = Buffer.from(content).toString('base64');
    SSH(`> /tmp/d_b64.txt`);
    for (let i = 0; i < b64.length; i += 4000) SSH(`echo -n '${b64.substring(i, i+4000)}' >> /tmp/d_b64.txt`);
    SSH(`mkdir -p $(dirname ${remotePath}) && base64 -d /tmp/d_b64.txt > ${remotePath}`);
    console.log(`✅ ${localPath}`);
};

try {
    // Backend
    deployFile('backend/controllers/adminController.js', '/var/www/man2man/backend/controllers/adminController.js');
    
    // Frontend
    deployFile('frontend/app/admin/layout.js', '/var/www/man2man/frontend/app/admin/layout.js');

    // Restart backend
    console.log('\nRestarting backend...');
    SSH(`cd /var/www/man2man && docker compose -f docker-compose.prod.yml restart backend`);
    console.log('✅ Backend restarted.');

    // Rebuild frontend
    console.log('Rebuilding frontend...');
    SSH(`cd /var/www/man2man && docker compose -f docker-compose.prod.yml up -d --build frontend`);
    console.log('✅ Frontend rebuilt.');

    console.log('\n🎉 Deploy complete!');
} catch (e) {
    console.error('Failed:', e.message);
}
