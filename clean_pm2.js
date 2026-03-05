const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function cleanPM2() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('--- KILLING PM2 DAEMON ---');
        await ssh.execCommand('pm2 kill');

        console.log('--- STARTING BACKEND ---');
        const r1 = await ssh.execCommand('pm2 start server.js --name "man2man-backend"', { cwd: '/var/www/man2man/backend' });
        console.log(r1.stdout);

        console.log('--- STARTING FRONTEND ---');
        const r2 = await ssh.execCommand('pm2 start npm --name "man2man-frontend" -- start', { cwd: '/var/www/man2man/frontend' });
        console.log(r2.stdout);

        console.log('--- SAVING PM2 ---');
        await ssh.execCommand('pm2 save');

        console.log('--- FINAL LOG CHECK ---');
        const r3 = await ssh.execCommand('pm2 logs man2man-backend --lines 25 --nostream');
        console.log(r3.stdout);
        console.log(r3.stderr);

        ssh.dispose();
    } catch (err) {
        console.log(err);
    }
}
cleanPM2();
