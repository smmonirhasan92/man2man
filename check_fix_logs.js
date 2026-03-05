const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkFix() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('--- FETCHING PM2 LOGS ---');
        const r1 = await ssh.execCommand('pm2 logs man2man-backend --lines 20 --nostream');
        console.log(r1.stdout);

        ssh.dispose();
    } catch (err) {
        console.log(err);
    }
}
checkFix();
