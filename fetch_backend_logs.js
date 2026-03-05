const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function getLogs() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('--- FETCHING PM2 LOGS ---');
        const r1 = await ssh.execCommand('pm2 logs man2man-backend --lines 100 --nostream', { cwd: '/var/www/man2man' });
        console.log(r1.stdout);
        console.log(r1.stderr);

        ssh.dispose();
    } catch (err) {
        console.log(err);
    }
}
getLogs();
