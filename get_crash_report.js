const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const fs = require('fs');

async function debugVPS() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        let res = await ssh.execCommand('pm2 status');
        let logs = await ssh.execCommand('pm2 logs frontend --lines 100 --nostream');
        let backLogs = await ssh.execCommand('pm2 logs man2man-backend --lines 20 --nostream');
        
        fs.writeFileSync('vps_crash_report.txt', "--- STATUS ---\n" + res.stdout + "\n\n--- FRONTEND LOGS ---\n" + logs.stdout + "\n" + logs.stderr + "\n\n--- BACKEND LOGS ---\n" + backLogs.stdout);
        console.log("Crash report generated.");
        ssh.dispose();
    } catch (err) {
        console.error('Failed:', err);
        ssh.dispose();
    }
}
debugVPS();
