const fs = require('fs');
const { execSync } = require('child_process');

const email = fs.readFileSync('backend/modules/auth/EmailService.js');
const dkim = fs.readFileSync('dkim-private.pem');

const emailB64 = email.toString('base64');
const dkimB64 = dkim.toString('base64');

console.log('Writing EmailService.js...');
execSync(`node scripts/ssh_runner.js "echo ${emailB64} | base64 -d > /var/www/man2man/backend/modules/auth/EmailService.js"`);

console.log('Writing dkim...');
execSync(`node scripts/ssh_runner.js "echo ${dkimB64} | base64 -d > /var/www/man2man/backend/config/dkim-private.pem"`);

console.log('Rebuilding backend...');
execSync(`node scripts/ssh_runner.js "cd /var/www/man2man && docker compose -f docker-compose.prod.yml up -d --build backend"`);

console.log('Success!');
