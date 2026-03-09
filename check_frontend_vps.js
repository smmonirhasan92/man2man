const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkFrontend() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
        });

        console.log("--- Port Check (Backend: 5050, Frontend: 3000) ---");
        const netstat = await ssh.execCommand('netstat -tuln | grep -E "5050|3000"');
        console.log(netstat.stdout || "No processes on these ports");

        console.log("--- PM2 Status ---");
        const pm2 = await ssh.execCommand('pm2 status');
        console.log(pm2.stdout);

        console.log("--- PM2 Logs man2man-frontend ---");
        const logs = await ssh.execCommand('pm2 logs man2man-frontend --lines 50 --nostream --no-colors');
        console.log(logs.stdout);
        console.log(logs.stderr);

        console.log("--- Restarting Frontend ---");
        const restart = await ssh.execCommand('pm2 restart man2man-frontend');
        console.log(restart.stdout);

    } catch (err) {
        console.error("SSH Error:", err);
    } finally {
        ssh.dispose();
    }
}

checkFrontend();
