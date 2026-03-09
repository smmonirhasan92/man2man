const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function monitorLogs() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        console.log("--- Detailed PM2 Status ---");
        const list = await ssh.execCommand('pm2 list');
        console.log(list.stdout);

        console.log("--- Backend Boot Logs (Check model progress) ---");
        const logs = await ssh.execCommand('pm2 logs man2man-backend --lines 50 --nostream --no-colors');
        console.log(logs.stdout);

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
monitorLogs();
