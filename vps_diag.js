const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const fs = require('fs');

async function getLogs() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
        });

        console.log("Fetching logs...");
        const result = await ssh.execCommand('pm2 logs backend --lines 50 --nostream');
        fs.writeFileSync('vps_debug_logs.txt', result.stdout + '\n' + result.stderr);
        console.log("Logs saved to vps_debug_logs.txt");

    } catch (err) {
        console.error("Error:", err);
    } finally {
        ssh.dispose();
    }
}

getLogs();
