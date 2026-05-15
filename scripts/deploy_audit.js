const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const auditScriptPath = path.join(__dirname, 'audit_vps.js');
const base64Content = fs.readFileSync(auditScriptPath).toString('base64');

// We use node -e on the VPS to write the file from base64
const vpsCommand = `node -e "require('fs').writeFileSync('/var/www/man2man/scripts/audit_vps.js', Buffer.from('${base64Content}', 'base64'))"`;

const sshCommand = `node scripts/ssh_runner.js "${vpsCommand.replace(/"/g, '\\"')}"`;

try {
    console.log('Uploading audit script via base64...');
    execSync(sshCommand, { stdio: 'inherit' });
    
    console.log('\nRunning audit script on VPS...');
    execSync('node scripts/ssh_runner.js "node /var/www/man2man/scripts/audit_vps.js"', { stdio: 'inherit' });
} catch (err) {
    console.error('Error:', err.message);
}
