const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkRestoration() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        console.log("--- Netstat Check (Live) ---");
        const netstat = await ssh.execCommand('netstat -tuln | grep -E "3000|5050"');
        console.log(netstat.stdout || "WAIT: Still not listening on 3000/5050.");

        console.log("--- PM2 Detailed Status ---");
        const list = await ssh.execCommand('pm2 list');
        console.log(list.stdout);

        console.log("--- Backend Error Logs (First 20 after restart) ---");
        const errLogs = await ssh.execCommand('pm2 logs man2man-backend --lines 20 --nostream --no-colors');
        console.log(errLogs.stdout);

        console.log("--- Frontend Error Logs ---");
        const frontLogs = await ssh.execCommand('pm2 logs man2man-frontend --lines 20 --nostream --no-colors');
        console.log(frontLogs.stdout);

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
checkRestoration();
