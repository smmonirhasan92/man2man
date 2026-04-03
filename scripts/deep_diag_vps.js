const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function deepCheck() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        console.log("--- PM2 Status ---");
        const pm2 = await ssh.execCommand('pm2 status');
        console.log(pm2.stdout);

        console.log("--- Netstat 5050 ---");
        const netstat = await ssh.execCommand('netstat -tulnp | grep 5050');
        console.log(netstat.stdout || "NOT LISTENING ON 5050");

        console.log("--- Backend Error Logs (Last 100) ---");
        const errLogs = await ssh.execCommand('pm2 logs man2man-backend --err --lines 100 --nostream --no-colors');
        console.log(errLogs.stdout);

        console.log("--- Backend Output Logs (Last 100) ---");
        const outLogs = await ssh.execCommand('pm2 logs man2man-backend --out --lines 100 --nostream --no-colors');
        console.log(outLogs.stdout);

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
deepCheck();
