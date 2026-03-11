const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function check() {
    await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });

    console.log('--- FINAL CODE VERIFICATION (FRONTEND) ---');
    const r = await ssh.execCommand('grep "NXS" /var/www/man2man/frontend/components/admin/UserProfileModal.js | head -n 5');
    console.log(r.stdout.trim() || 'NXS not found in frontend code!');

    console.log('\n--- FINAL CODE VERIFICATION (BACKEND) ---');
    const r2 = await ssh.execCommand('grep "NXS_RATIO" /var/www/man2man/backend/controllers/adminController.js');
    console.log(r2.stdout.trim() || 'NXS_RATIO not found in backend code!');

    ssh.dispose();
}

check().catch(console.error);
