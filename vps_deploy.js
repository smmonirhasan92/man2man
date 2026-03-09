const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function deploy() {
    await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });
    console.log('✅ Connected. Deploying...\n');

    const r = await ssh.execCommand(
        'cd /var/www/man2man && git pull origin main && cd frontend && npm run build && pm2 restart all',
        { cwd: '/var/www/man2man', stream: 'both', onStdout: (c) => process.stdout.write(c), onStderr: (c) => process.stderr.write(c) }
    );

    console.log('\n--- EXIT CODE:', r.code, '---');
    ssh.dispose();
}

deploy().catch(console.error);
