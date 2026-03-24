const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const fs = require('fs');

async function updateSw() {
    const original = fs.readFileSync('d:/man2man/vps_sw.js', 'utf8');
    
    // Simple version boost to force cache update
    const updated = original.replace(/const CACHE_NAME = '.*';/, `const CACHE_NAME = 'man2man-v\${Date.now()}';`);
    
    fs.writeFileSync('d:/man2man/sw_vps_updated.js', updated);

    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });
        await ssh.putFile('d:/man2man/sw_vps_updated.js', '/var/www/man2man/frontend/public/sw.js');
        console.log('✅ Service Worker updated on VPS');
        ssh.dispose();
    } catch (e) {
        console.error(e);
        ssh.dispose();
    }
}

updateSw();
