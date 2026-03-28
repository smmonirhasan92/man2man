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
        
        console.log('--- VPS BRANCH ---');
        const res1 = await ssh.execCommand('git branch', { cwd: '/var/www/man2man' });
        console.log(res1.stdout);

        console.log('--- VPS Shield grep ---');
        const res2 = await ssh.execCommand('grep -nC 5 "Shield" backend/server.js', { cwd: '/var/www/man2man' });
        console.log(res2.stdout);

        console.log('--- VPS StakingModel grep ---');
        const res3 = await ssh.execCommand('grep -r "StakingModel" backend/', { cwd: '/var/www/man2man' });
        console.log(res3.stdout);

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
audit();
