const { NodeSSH } = require('node-ssh');
const fs = require('fs');

async function fetchLogs() {
    const ssh = new NodeSSH();
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('Connected. Fetching backend error logs...');
        const result = await ssh.execCommand('tail -n 100 /root/.pm2/logs/man2man-backend-error.log');

        fs.writeFileSync('backend_errors.txt', result.stderr + '\n' + result.stdout);
        console.log('Logs saved to backend_errors.txt');

        const feResult = await ssh.execCommand('curl -i http://localhost:5050/api/auth/me');
        fs.writeFileSync('backend_out.txt', feResult.stdout + '\n' + feResult.stderr);

        const beStatus = await ssh.execCommand('curl -i https://usaaffiliatemarketing.com/api/auth/me');
        fs.writeFileSync('frontend_out.txt', beStatus.stdout + '\n' + beStatus.stderr);

    } catch (err) {
        console.error(err);
    } finally {
        ssh.dispose();
    }
}

fetchLogs();
