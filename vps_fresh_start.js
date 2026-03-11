const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function check() {
    await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });

    console.log('--- SEARCHING FOR GHOST NODE PROCESSES ---');
    const r = await ssh.execCommand('ps aux | grep node');
    console.log(r.stdout.trim());

    console.log('\n--- CLEARING NEXT.JS CACHE AND REBUILDING ---');
    // We'll delete the .next folder and rebuild
    const r2 = await ssh.execCommand('cd /var/www/man2man/frontend && rm -rf .next && npm run build && pm2 restart all', {
        onStdout: (c) => process.stdout.write(c),
        onStderr: (c) => process.stderr.write(c)
    });
    console.log('\n--- FRESH BUILD EXIT CODE:', r2.code, '---');

    ssh.dispose();
}

check().catch(console.error);
