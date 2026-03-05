const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkCleanLogs() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('--- RECENT PM2 LOG ---');
        const r1 = await ssh.execCommand('tail -n 50 /root/.pm2/logs/man2man-backend-error.log');
        console.log(r1.stdout);
        console.log("-------");
        const r2 = await ssh.execCommand('tail -n 50 /root/.pm2/logs/man2man-backend-out.log');
        console.log(r2.stdout);

        ssh.dispose();
    } catch (err) {
        console.log(err);
    }
}
checkCleanLogs();
