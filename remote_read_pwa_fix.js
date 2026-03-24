const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function readPwaFile() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });
        const res = await ssh.execCommand('cat /var/www/man2man/frontend/components/PWAInstallPrompt.js');
        console.log(res.stdout);
        ssh.dispose();
    } catch (err) {
        console.error('Read Failed:', err);
        ssh.dispose();
    }
}

readPwaFile();
