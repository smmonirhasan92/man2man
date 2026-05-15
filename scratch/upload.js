const fs = require('fs');
const { execSync } = require('child_process');

const emailServiceContent = fs.readFileSync('backend/modules/auth/EmailService.js', 'utf8');
const dkimContent = fs.readFileSync('dkim-private.pem', 'utf8');

const emailBase64 = Buffer.from(emailServiceContent).toString('base64');
const dkimBase64 = Buffer.from(dkimContent).toString('base64');

console.log('Uploading EmailService.js...');
execSync(`node scripts/ssh_runner.js "echo '${emailBase64}' | base64 -d > /var/www/man2man/backend/modules/auth/EmailService.js"`, { stdio: 'inherit' });

console.log('Uploading dkim-private.pem...');
execSync(`node scripts/ssh_runner.js "echo '${dkimBase64}' | base64 -d > /var/www/man2man/backend/config/dkim-private.pem"`, { stdio: 'inherit' });

console.log('Rebuilding backend container...');
execSync(`node scripts/ssh_runner.js "cd /var/www/man2man && docker compose -f docker-compose.prod.yml up -d --build backend"`, { stdio: 'inherit' });

console.log('Done!');
