const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function check() {
    await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });

    console.log('--- WRITING TO FILE ON VPS ---');
    await ssh.execCommand('echo "// ANTIGRAVITY_TEST" >> /var/www/man2man/frontend/components/admin/UserProfileModal.js');

    console.log('\n--- READING FILE BACK ---');
    const r = await ssh.execCommand('tail -n 1 /var/www/man2man/frontend/components/admin/UserProfileModal.js');
    console.log('Last line:', r.stdout.trim());

    console.log('\n--- GIT DIFF AFTER WRITE ---');
    const r2 = await ssh.execCommand('cd /var/www/man2man && git diff frontend/components/admin/UserProfileModal.js');
    console.log(r2.stdout.trim() || 'STILL NO DIFF? (This would mean git is not tracking this physical file)');

    ssh.dispose();
}

check().catch(console.error);
