const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function check() {
    await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });

    console.log('--- SYMLINK CHECK (FRONTEND) ---');
    const r = await ssh.execCommand('ls -l /var/www/man2man/frontend/components/admin/UserProfileModal.js');
    console.log(r.stdout.trim());

    console.log('\n--- SYMLINK CHECK (BACKEND) ---');
    const r2 = await ssh.execCommand('ls -l /var/www/man2man/backend/controllers/adminController.js');
    console.log(r2.stdout.trim());

    console.log('\n--- GIT INDEX VS DISK DIFF ---');
    // We'll see if git thinks the file is modified
    const r3 = await ssh.execCommand('cd /var/www/man2man && git diff frontend/components/admin/UserProfileModal.js');
    console.log(r3.stdout.trim() || 'Git says no diff (This is the paradox!)');

    ssh.dispose();
}

check().catch(console.error);
