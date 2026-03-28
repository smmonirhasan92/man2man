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

        console.log('--- 1. PM2 Status ---');
        const status = await ssh.execCommand('pm2 status');
        console.log(status.stdout);

        console.log('\n--- 2. Last 100 Lines of Logs ---');
        const logs = await ssh.execCommand('pm2 logs --lines 100 --nostream');
        console.log(logs.stdout);

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
getLogs();
