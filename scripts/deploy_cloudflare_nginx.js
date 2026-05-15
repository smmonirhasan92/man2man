const { execSync } = require('child_process');

const SSH = (cmd) => {
    return execSync(`node scripts/ssh_runner.js "${cmd.replace(/"/g, '\\"')}"`, { encoding: 'utf8' });
};

try {
    const patchScript = `
const fs = require('fs');
const https = require('https');

const fetchIPs = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data.split('\\n').filter(ip => ip.trim() !== '')));
        }).on('error', reject);
    });
};

(async () => {
    console.log('Fetching Cloudflare IP ranges...');
    const ipv4 = await fetchIPs('https://www.cloudflare.com/ips-v4');
    const ipv6 = await fetchIPs('https://www.cloudflare.com/ips-v6');
    
    let configStr = '# Cloudflare Real IP configuration\\n';
    
    for (const ip of [...ipv4, ...ipv6]) {
        configStr += \`set_real_ip_from \${ip};\\n\`;
    }
    
    configStr += 'real_ip_header CF-Connecting-IP;\\n';
    
    fs.writeFileSync('/etc/nginx/conf.d/cloudflare.conf', configStr);
    console.log('Saved Cloudflare Real IP config to /etc/nginx/conf.d/cloudflare.conf');
})();
`;

    const b64 = Buffer.from(patchScript).toString('base64');
    SSH(`echo '${b64}' | base64 -d > /tmp/cloudflare_ips.js`);
    console.log(SSH(`node /tmp/cloudflare_ips.js`));
    
    console.log(SSH('nginx -t'));
    SSH('systemctl reload nginx');
    console.log('Nginx successfully configured for Cloudflare Real IPs!');
} catch (e) {
    console.error('Error:', e.message);
}
