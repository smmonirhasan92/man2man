const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function audit() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- VPS server.js 25-55 ---');
        const res = await ssh.execCommand('sed -n "25,55p" backend/server.js', { cwd: '/var/www/man2man' });
        console.log(res.stdout);

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
audit();
