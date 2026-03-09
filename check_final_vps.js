const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkFinalStatus() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        console.log("--- PM2 Checklist ---");
        const list = await ssh.execCommand('pm2 list');
        console.log(list.stdout);

        console.log("--- Port Listeners ---");
        const netstat = await ssh.execCommand('netstat -tuln | grep -E "3000|5050"');
        console.log(netstat.stdout || "Wait ports not ready?");

        console.log("--- AI Chat Follow-up (Wait model...) ---");
        const chat = await ssh.execCommand('curl -s -X POST http://localhost:5050/api/chat -H "Content-Type: application/json" -d "{\\\"message\\\": \\\"Why is USA Affiliate good?\\\"}"');
        console.log("Reply:", chat.stdout);

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
checkFinalStatus();
