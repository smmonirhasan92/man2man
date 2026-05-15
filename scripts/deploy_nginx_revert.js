const { execSync } = require('child_process');

const SSH = (cmd) => {
    return execSync(`node scripts/ssh_runner.js "${cmd.replace(/"/g, '\\"')}"`, { encoding: 'utf8' });
};

try {
    const patchScript = `
const fs = require('fs');

const sslFile = '/etc/letsencrypt/options-ssl-nginx.conf';
let sslConfig = fs.readFileSync(sslFile, 'utf8');
// Remove ssl_buffer_size 4k as it causes ERR_CONNECTION_ABORTED on some mobile Chrome browsers
sslConfig = sslConfig.replace(/ssl_buffer_size 4k; \\/\\/ Mobile MTU Fix/g, '');
// Explicitly set it back to default or leave it removed (default is 16k)
fs.writeFileSync(sslFile, sslConfig);
console.log('Reverted ssl_buffer_size.');
`;

    const b64 = Buffer.from(patchScript).toString('base64');
    SSH(`echo '${b64}' | base64 -d > /tmp/revert_nginx.js`);
    console.log(SSH(`node /tmp/revert_nginx.js`));
    
    console.log(SSH('nginx -t'));
    SSH('systemctl reload nginx');
    console.log('Nginx reloaded. Connection Aborted issue should be fixed.');
} catch (e) {
    console.error('Error:', e.message);
}
