const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function finalCheck() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        console.log('--- Memory Usage ---');
        const mem = await ssh.execCommand('free -m');
        console.log(mem.stdout);

        console.log('--- PM2 Log Snapshot (Last 50) ---');
        const logs = await ssh.execCommand('pm2 logs backend --lines 50 --nostream --no-colors');
        console.log(logs.stdout);

        console.log('--- Testing /api/chat ---');
        const res = await ssh.execCommand('curl -s -X POST http://localhost:5050/api/chat -H "Content-Type: application/json" -d "{\\\"message\\\": \\\"Hello agent, tell me about USA Affiliate.\\\"}"');
        console.log('Response Body:', res.stdout);

    } catch (e) { console.error('Verification Script Failed:', e); } finally { ssh.dispose(); }
}
finalCheck();
