const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkRestorationFinal() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        console.log("--- Netstat Check (Post-Rebuild) ---");
        const netstat = await ssh.execCommand('netstat -tuln | grep -E "3000|5050"');
        console.log(netstat.stdout || "WAIT: Still nothing listening? Checking PM2 statuses...");

        console.log("--- PM2 Status Report ---");
        const list = await ssh.execCommand('pm2 jlist');
        const apps = JSON.parse(list.stdout);
        apps.forEach(a => {
            console.log(`[${a.name}] - Status: ${a.pm2_env.status}, PID: ${a.pid}, Restarts: ${a.pm2_env.restart_time}`);
        });

        console.log("--- Dashboard Local Test (Port 3000) ---");
        const fe = await ssh.execCommand('curl -I http://localhost:3000');
        console.log(fe.stdout);

        console.log("--- AI Chat Test (Port 5050) ---");
        const chat = await ssh.execCommand('curl -s -X POST http://localhost:5050/api/chat -H "Content-Type: application/json" -d "{\\\"message\\\": \\\"Confirm system is online!\\\"}"');
        console.log("Chat Response:", chat.stdout);

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
checkRestorationFinal();
