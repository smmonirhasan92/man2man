const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function deploy() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('--- DEPLOYING BACKEND FIX ---');
        const pull = await ssh.execCommand('git pull origin main', { cwd: '/var/www/man2man' });
        console.log(pull.stdout);
        const res = await ssh.execCommand('pm2 restart man2man-backend');
        console.log(res.stdout);
        console.log('Done.');
        ssh.dispose();
    } catch (err) {
        console.log(err);
    }
}
deploy();
