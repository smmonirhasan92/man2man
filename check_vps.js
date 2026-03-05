const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function check() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('--- GIT LOG ---');
        const r1 = await ssh.execCommand('git log -n 3 --oneline', { cwd: '/var/www/man2man' });
        console.log(r1.stdout);
        console.log(r1.stderr);

        console.log('--- GIT STATUS ---');
        const r2 = await ssh.execCommand('git status', { cwd: '/var/www/man2man' });
        console.log(r2.stdout);

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
check();
