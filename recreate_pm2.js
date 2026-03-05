const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function recreatePM2() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('--- RECREATING FULL PM2 BACKEND ---');
        // Delete the ghost process
        await ssh.execCommand('pm2 delete man2man-backend');
        console.log('--- STARTING CLEAN PROCESS ---');
        // Recreate it natively in the correct directory
        const r1 = await ssh.execCommand('pm2 start server.js --name "man2man-backend"', { cwd: '/var/www/man2man/backend' });
        console.log(r1.stdout);

        console.log('--- SAVING PM2 ---');
        await ssh.execCommand('pm2 save');

        console.log('--- CHECKING LOGS OF NEW PROCESS ---');
        const r2 = await ssh.execCommand('pm2 logs man2man-backend --lines 20 --nostream');
        console.log(r2.stdout);
        console.log(r2.stderr);

        ssh.dispose();
    } catch (err) {
        console.log(err);
    }
}
recreatePM2();
