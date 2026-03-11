const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function check() {
    await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });
    console.log('--- GIT STATUS ---');
    await ssh.execCommand('cd /var/www/man2man && git status', { onStdout: (c) => process.stdout.write(c) });

    console.log('\n--- BACKEND CODE CHECK ---');
    await ssh.execCommand('grep "NXS_RATIO" /var/www/man2man/backend/controllers/adminController.js', { onStdout: (c) => process.stdout.write(c) });

    console.log('\n--- FRONTEND FILE DATES ---');
    await ssh.execCommand('ls -la /var/www/man2man/frontend/.next', { onStdout: (c) => process.stdout.write(c) });

    console.log('\n--- PM2 STATUS ---');
    await ssh.execCommand('pm2 list', { onStdout: (c) => process.stdout.write(c) });

    ssh.dispose();
}

check().catch(console.error);
