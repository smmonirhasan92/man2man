const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function downloadPwa() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });
        await ssh.getFile('d:/man2man/vps_PWAInstallPrompt.js', '/var/www/man2man/frontend/components/PWAInstallPrompt.js');
        ssh.dispose();
        console.log('✅ Downloaded PWAInstallPrompt.js');
    } catch (err) {
        console.error('Download Failed:', err);
        ssh.dispose();
    }
}

downloadPwa();
