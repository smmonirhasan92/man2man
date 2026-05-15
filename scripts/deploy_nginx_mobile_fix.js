const { execSync } = require('child_process');

const SSH = (cmd) => {
    return execSync(`node scripts/ssh_runner.js "${cmd.replace(/"/g, '\\"')}"`, { encoding: 'utf8' });
};

try {
    const patchScript = `
const fs = require('fs');

// Patch 1: SSL Options
const sslFile = '/etc/letsencrypt/options-ssl-nginx.conf';
let sslConfig = fs.readFileSync(sslFile, 'utf8');
sslConfig = sslConfig.replace('ssl_session_tickets off;', 'ssl_session_tickets on;\\nssl_buffer_size 4k; // Mobile MTU Fix');
fs.writeFileSync(sslFile, sslConfig);
console.log('SSL Config patched.');

// Patch 2: Nginx Buffer
const nginxFile = '/etc/nginx/sites-enabled/usaaffiliatemarketing.com';
let nginxConfig = fs.readFileSync(nginxFile, 'utf8');
nginxConfig = nginxConfig.replace(/proxy_read_timeout 120s;/g, 'proxy_read_timeout 60s;\\n    proxy_buffering on;\\n    proxy_buffers 16 16k;\\n    proxy_buffer_size 16k;');
fs.writeFileSync(nginxFile, nginxConfig);
console.log('Nginx site config patched.');
`;

    const b64 = Buffer.from(patchScript).toString('base64');
    SSH(`echo '${b64}' | base64 -d > /tmp/patch_nginx.js`);
    console.log(SSH(`node /tmp/patch_nginx.js`));
    
    console.log('Testing Nginx config...');
    console.log(SSH('nginx -t'));
    
    console.log('Reloading Nginx...');
    SSH('systemctl reload nginx');
    
    console.log('Nginx successfully optimized for Mobile Data!');
} catch (e) {
    console.error('Error:', e.message);
}
