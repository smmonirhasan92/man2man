const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function finalCheck() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        console.log("--- PM2 Status (Text Clean) ---");
        const list = await ssh.execCommand('pm2 jlist');
        const apps = JSON.parse(list.stdout);
        const statusReport = apps.map(a => `${a.name}: ${a.pm2_env.status} (Restarts: ${a.pm2_env.restart_time})`).join('\n');
        console.log(statusReport);

        console.log("--- AI Chat Final Test ---");
        const chat = await ssh.execCommand('curl -s -X POST http://localhost:5050/api/chat -H "Content-Type: application/json" -d "{\\\"message\\\": \\\"Hello, why is USA Affiliate the best earning platform?\\\"}"');
        console.log("Response JSON:", chat.stdout);

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
finalCheck();
