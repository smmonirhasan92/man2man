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
        await ssh.execCommand('tail -n 100 /root/.pm2/logs/man2man-backend-error*.log > /var/www/man2man/error_dump.txt', { cwd: '/var/www' });
        const r1 = await ssh.execCommand('cat /var/www/man2man/error_dump.txt', { cwd: '/var/www' });
        console.log(r1.stdout);
        console.log(r1.stderr);

        ssh.dispose();
    } catch (err) {
        console.log(err);
    }
}
getErrorLogs();
