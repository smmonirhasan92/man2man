const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function check() {
    await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });

    console.log('--- ATTEMPTING MANUAL FRONTEND BUILD ---');
    // We'll run it and see the output.
    const r = await ssh.execCommand('cd /var/www/man2man/frontend && npm run build', {
        onStdout: (c) => process.stdout.write(c),
        onStderr: (c) => process.stderr.write(c)
    });

    console.log('\n--- BUILD EXIT CODE:', r.code, '---');
    ssh.dispose();
}

check().catch(console.error);
