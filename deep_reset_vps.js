const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function deepReset() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        console.log("--- Nuke Port 3000 and 5050 ---");
        // Using kill -9 on fuser output
        await ssh.execCommand('fuser -k 3000/tcp');
        await ssh.execCommand('fuser -k 5050/tcp');

        console.log("--- PM2 Kill All ---");
        await ssh.execCommand('pm2 kill');

        console.log("--- Starting Frontend via PM2 ---");
        // We use absolute path to ensure no "Invalid project directory"
        const startFE = await ssh.execCommand('pm2 start npm --name "man2man-frontend" -- start', { cwd: '/var/www/man2man/frontend' });
        console.log(startFE.stdout);

        console.log("--- Starting Backend via PM2 ---");
        const startBE = await ssh.execCommand('pm2 start server.js --name "man2man-backend"', { cwd: '/var/www/man2man/backend' });
        console.log(startBE.stdout);

        console.log("--- PM2 Status ---");
        const status = await ssh.execCommand('pm2 status');
        console.log(status.stdout);

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
deepReset();
