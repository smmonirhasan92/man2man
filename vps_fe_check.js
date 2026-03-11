const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function check() {
    await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });

    console.log('--- FRONTEND BUILD CHECK ---');
    // Check the date of the chunks
    const r = await ssh.execCommand('ls -lt /var/www/man2man/frontend/.next/static/chunks | head -n 10');
    console.log(r.stdout.trim());

    console.log('\n--- FRONTEND BUILD LOG ---');
    // Ideally we want to see the output of the last build, but we can't easily.
    // Let's check if the directory even exists.
    const r2 = await ssh.execCommand('ls -d /var/www/man2man/frontend/.next');
    console.log('Build dir exists:', r2.stdout.trim());

    ssh.dispose();
}

check().catch(console.error);
