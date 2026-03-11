const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function check() {
    await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });

    console.log('--- READING BACKEND NXS LOGIC (Lines 540-590) ---');
    const r = await ssh.execCommand('sed -n "540,590p" /var/www/man2man/backend/controllers/adminController.js');
    console.log(r.stdout.trim() || 'Empty range (sed failed?)');

    ssh.dispose();
}

check().catch(console.error);
