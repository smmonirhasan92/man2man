const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function nukeAndReset() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        console.log("--- PM2 Kill All ---");
        await ssh.execCommand('pm2 kill');

        console.log("--- Killing Zombie Processes on Ports 5050 and 3000 ---");
        // Use fuser or lsof to kill
        await ssh.execCommand('fuser -k 5050/tcp');
        await ssh.execCommand('fuser -k 3000/tcp');

        console.log("--- Starting via Ecosystem ---");
        const start = await ssh.execCommand('pm2 start /var/www/man2man/ecosystem.config.js');
        console.log(start.stdout);

        console.log("--- PM2 Status ---");
        const status = await ssh.execCommand('pm2 status');
        console.log(status.stdout);

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
nukeAndReset();
