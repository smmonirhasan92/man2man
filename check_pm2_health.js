const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkPM2Health() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('--- PM2 STATUS ---');
        const r1 = await ssh.execCommand('pm2 list');
        console.log(r1.stdout);

        console.log('--- REAL CURRENT ERRORS ---');
        const r2 = await ssh.execCommand('pm2 logs man2man-backend --lines 15 --nostream');
        console.log(r2.stdout);
        console.log(r2.stderr);

        ssh.dispose();
    } catch (err) {
        console.log(err);
    }
}
checkPM2Health();
