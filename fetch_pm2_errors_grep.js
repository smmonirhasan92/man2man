const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function getErrorLogs() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('--- FETCHING PM2 ERROR LOG ---');
        const r1 = await ssh.execCommand('tail -n 100 /root/.pm2/logs/man2man-backend-error*.log | grep -A 5 -B 2 "Error"', { cwd: '/var/www/man2man' });
        console.log(r1.stdout);
        console.log(r1.stderr);

        ssh.dispose();
    } catch (err) {
        console.log(err);
    }
}
getErrorLogs();
