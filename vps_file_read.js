const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function check() {
    await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });

    console.log('--- READING BACKEND FILE (LINE 530-560) ---');
    const r = await ssh.execCommand('sed -n "530,560p" /var/www/man2man/backend/controllers/adminController.js');
    console.log(r.stdout.trim());

    console.log('\n--- READING FRONTEND FILE (UserProfileModal.js) ---');
    const r2 = await ssh.execCommand('grep "Platform Position" /var/www/man2man/frontend/components/admin/UserProfileModal.js -C 5');
    console.log(r2.stdout.trim());

    ssh.dispose();
}

check().catch(console.error);
