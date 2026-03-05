const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkDead() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('--- RECENT PM2 STATE ---');
        const r1 = await ssh.execCommand('pm2 list');
        console.log(r1.stdout);

        console.log('--- NEW CRASH LOGS ---');
        const r2 = await ssh.execCommand('pm2 logs man2man-backend --lines 20 --nostream');
        console.log(r2.stdout);
        console.log(r2.stderr);

        ssh.dispose();
    } catch (err) {
        console.log(err);
    }
}
checkDead();
