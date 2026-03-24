const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function downloadPwaConfig() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });
        await ssh.getFile('d:/man2man/vps_manifest.json', '/var/www/man2man/frontend/public/manifest.json');
        await ssh.getFile('d:/man2man/vps_sw.js', '/var/www/man2man/frontend/public/sw.js');
        ssh.dispose();
        console.log('✅ Downloaded manifest.json and sw.js');
    } catch (err) {
        console.error('Download Failed:', err);
        ssh.dispose();
    }
}

downloadPwaConfig();
