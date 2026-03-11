const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function fix() {
    await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });
    console.log('✅ Connected. Fixing VPS git state...\n');

    const commands = [
        'cd /var/www/man2man && git stash',
        'cd /var/www/man2man && git pull origin main',
        'cd /var/www/man2man/frontend && npm run build',
        'pm2 restart all'
    ];

    for (const cmd of commands) {
        console.log(`Running: ${cmd}`);
        const r = await ssh.execCommand(cmd, {
            cwd: '/var/www/man2man',
            onStdout: (c) => process.stdout.write(c),
            onStderr: (c) => process.stderr.write(c)
        });
        if (r.code !== 0) {
            console.error(`\n❌ Command failed with code ${r.code}`);
            break;
        }
    }

    ssh.dispose();
}

fix().catch(console.error);
