const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const auditScriptPath = path.join(__dirname, 'audit_vps.js');
const auditScriptContent = fs.readFileSync(auditScriptPath, 'utf8');

// Escape single quotes for the shell command
const escapedContent = auditScriptContent.replace(/'/g, "'\\''");

const command = `node scripts/ssh_runner.js "cat > /var/www/man2man/scripts/audit_vps.js << 'EOF'\n${auditScriptContent}\nEOF"`;

try {
    console.log('Uploading audit script to VPS...');
    execSync(command, { stdio: 'inherit' });
    
    console.log('\nRunning audit script on VPS...');
    execSync('node scripts/ssh_runner.js "node /var/www/man2man/scripts/audit_vps.js"', { stdio: 'inherit' });
} catch (err) {
    console.error('Error:', err.message);
}
