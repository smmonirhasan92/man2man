const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkStatus() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('\n--- PM2 STATUS ---');
        let res = await ssh.execCommand('pm2 status');
        console.log(res.stdout);

        console.log('\n--- PM2 LOGS (Last 50 lines) ---');
        res = await ssh.execCommand('pm2 logs --lines 50 --nostream');
        console.log(res.stdout);
        if (res.stderr) console.error(res.stderr);

        ssh.dispose();
    } catch (err) {
        console.error('Failed:', err);
        ssh.dispose();
    }
}
checkStatus();
