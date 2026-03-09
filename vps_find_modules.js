const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
async function run() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        console.log('--- DIR /var/www/man2man ---');
        const res1 = await ssh.execCommand('ls -F', { cwd: '/var/www/man2man' });
        console.log(res1.stdout);

        console.log('\n--- DIR /var/www/man2man/backend ---');
        const res2 = await ssh.execCommand('ls -F', { cwd: '/var/www/man2man/backend' });
        console.log(res2.stdout);

        console.log('\n--- FIND node_modules ---');
        const res3 = await ssh.execCommand('find /var/www/man2man -name node_modules -type d -maxdepth 3');
        console.log(res3.stdout);

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
run();
