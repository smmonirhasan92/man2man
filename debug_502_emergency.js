const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function debug502() {
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

        console.log('\n--- 2. Port 3000 Check ---');
        const port = await ssh.execCommand('lsof -i :3000');
        console.log(port.stdout || 'Nothing on 3000!');

        console.log('\n--- 3. PM2 Logs (Frontend) ---');
        const logs = await ssh.execCommand('pm2 logs frontend --lines 50 --nostream');
        console.log(logs.stdout);

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
debug502();
