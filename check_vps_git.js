const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkLog() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- VPS GIT LOG ---');
        const res1 = await ssh.execCommand('git log -n 1', { cwd: '/var/www/man2man' });
        console.log(res1.stdout);

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
checkLog();
