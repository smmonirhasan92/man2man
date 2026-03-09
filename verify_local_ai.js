const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const fs = require('fs');

async function verify() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        console.log("Testing AI Chat API response...");
        const result = await ssh.execCommand(`curl -s -X POST http://localhost:5050/api/chat -H "Content-Type: application/json" -d '{"message": "Hello, how can USA Affiliate help me?"}'`);
        console.log("API RESPONSE:\n", result.stdout);
        fs.writeFileSync('vps_api_test.txt', result.stdout);

        const logs = await ssh.execCommand('pm2 logs backend --lines 50 --nostream');
        fs.writeFileSync('vps_boot_logs.txt', logs.stdout);

    } catch (err) { console.error(err); } finally { ssh.dispose(); }
}
verify();
