const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function check() {
    await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });

    console.log('--- GIT ROOT PATH ---');
    const r = await ssh.execCommand('cd /var/www/man2man && git rev-parse --show-toplevel');
    console.log(r.stdout.trim());

    console.log('\n--- LISTING /var/www ---');
    const r2 = await ssh.execCommand('ls -la /var/www');
    console.log(r2.stdout.trim());

    console.log('\n--- CHECKING FOR LOCAL CHANGES ON VPS ---');
    const r3 = await ssh.execCommand('cd /var/www/man2man && git status --short');
    console.log(r3.stdout.trim() || 'No local changes');

    console.log('\n--- ACTUALLY CATTING adminController.js (Line 1-10) ---');
    const r4 = await ssh.execCommand('head -n 10 /var/www/man2man/backend/controllers/adminController.js');
    console.log(r4.stdout.trim());

    ssh.dispose();
}

check().catch(console.error);
