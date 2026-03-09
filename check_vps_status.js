const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkStatus() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
        });

        console.log("Checking PM2 status...");
        const pm2Result = await ssh.execCommand('pm2 status', { cwd: '/var/www/man2man' });
        console.log("PM2 STATUS:\n", pm2Result.stdout);

        console.log("Checking backend error log for new errors...");
        const errResult = await ssh.execCommand('pm2 logs backend --err --lines 20 --nostream', { cwd: '/var/www/man2man' });
        console.log("BACKEND ERRORS:\n", errResult.stdout);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        ssh.dispose();
    }
}

checkStatus();
