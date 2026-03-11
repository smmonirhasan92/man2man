const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function check() {
    await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });

    console.log('--- FORCING WORKING TREE REFRESH ---');
    const r = await ssh.execCommand('cd /var/www/man2man && git checkout . && git pull origin main', {
        onStdout: (c) => process.stdout.write(c),
        onStderr: (c) => process.stderr.write(c)
    });
    console.log('\n--- REFRESH EXIT CODE:', r.code, '---');

    console.log('\n--- VERIFYING FILE CONTENT AFTER REFRESH ---');
    const r2 = await ssh.execCommand('grep "NXS" /var/www/man2man/frontend/components/admin/UserProfileModal.js | head -n 1');
    console.log('NXS grep result:', r2.stdout.trim() || 'STILL MISSING!');

    ssh.dispose();
}

check().catch(console.error);
