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
    console.log(`Uploading ${localPath}...`);
    const content = fs.readFileSync(path.resolve(__dirname, '..', localPath), 'utf8');
    const b64 = Buffer.from(content).toString('base64');
    SSH(`> /tmp/deploy_tmp_b64.txt`);
    const chunkSize = 4000;
    for (let i = 0; i < b64.length; i += chunkSize) {
        SSH(`echo -n '${b64.substring(i, i + chunkSize)}' >> /tmp/deploy_tmp_b64.txt`);
    }
    SSH(`mkdir -p $(dirname ${remotePath}) && base64 -d /tmp/deploy_tmp_b64.txt > ${remotePath}`);
    console.log(`✅ ${localPath} deployed.`);
};

try {
    // Backend files
    deployFile('backend/controllers/adminController.js', '/var/www/man2man/backend/controllers/adminController.js');
    deployFile('backend/routes/adminRoutes.js', '/var/www/man2man/backend/routes/adminRoutes.js');
    
    // Frontend files
    deployFile('frontend/components/admin/AdminSidebar.js', '/var/www/man2man/frontend/components/admin/AdminSidebar.js');
    deployFile('frontend/app/admin/reports/page.js', '/var/www/man2man/frontend/app/admin/reports/page.js');

    // Restart backend
    console.log('Restarting backend...');
    SSH(`cd /var/www/man2man && docker compose -f docker-compose.prod.yml restart backend`);
    console.log('✅ Backend restarted.');

    // Rebuild frontend
    console.log('Rebuilding frontend...');
    SSH(`cd /var/www/man2man && docker compose -f docker-compose.prod.yml up -d --build frontend`);
    console.log('✅ Frontend rebuilt.');

    console.log('\n🎉 All files deployed successfully!');
} catch (e) {
    console.error('Deploy failed:', e.message);
}
