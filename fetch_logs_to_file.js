const { NodeSSH } = require('node-ssh');
const fs = require('fs');
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
        const r1 = await ssh.execCommand('tail -n 100 /root/.pm2/logs/man2man-backend-error*.log', { cwd: '/var/www/man2man' });
        fs.writeFileSync('remote_backend_error_only.log', r1.stdout + '\n' + r1.stderr);
        console.log('Wrote to remote_backend_error_only.log');

        ssh.dispose();
    } catch (err) {
        console.log(err);
    }
}
getErrorLogs();
