const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function check() {
    await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });

    console.log('--- FORCING HARD RESET ON VPS ---');
    const r = await ssh.execCommand('cd /var/www/man2man && git fetch origin && git reset --hard origin/main', {
        onStdout: (c) => process.stdout.write(c),
        onStderr: (c) => process.stderr.write(c)
    });
    console.log('\n--- RESET EXIT CODE:', r.code, '---');

    console.log('\n--- VERIFYING FILE CONTENT AFTER RESET ---');
    const r2 = await ssh.execCommand('grep "NXS_RATIO" /var/www/man2man/backend/controllers/adminController.js');
    console.log('NXS_RATIO grep result:', r2.stdout.trim() || 'STILL MISSING!');

    ssh.dispose();
}

check().catch(console.error);
