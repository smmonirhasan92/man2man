const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function getFrontLogs() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        console.log("--- PM2 Status ---");
        const status = await ssh.execCommand('pm2 status');
        console.log(status.stdout);

        console.log("--- Frontend Error Logs (Last 200) ---");
        const logs = await ssh.execCommand('pm2 logs man2man-frontend --lines 200 --nostream --no-colors');
        console.log(logs.stdout);
        console.log(logs.stderr);

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
getFrontLogs();
