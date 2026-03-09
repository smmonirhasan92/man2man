const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function deepCheck() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        console.log("--- Port Check (Netstat) ---");
        const netstat = await ssh.execCommand('netstat -tuln | grep -E "3000|5050"');
        console.log(netstat.stdout || "WAIT: No ports 3000/5050 found listening.");

        console.log("--- PM2 Status Report ---");
        const list = await ssh.execCommand('pm2 jlist');
        const apps = JSON.parse(list.stdout);
        apps.forEach(a => {
            console.log(`[${a.name}] - Status: ${a.pm2_env.status}, PID: ${a.pid}, Restarts: ${a.pm2_env.restart_time}`);
        });

        console.log("--- Backend Error Logs (Last 20) ---");
        const errLogs = await ssh.execCommand('pm2 logs man2man-backend --lines 20 --nostream --no-colors');
        console.log(errLogs.stdout);

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
deepCheck();
