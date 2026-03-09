const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const fs = require('fs');

async function getFullLogs() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        // Let's use journalctl if it's managed by systemd, or find the pm2 logs
        // PM2 logs usually at /root/.pm2/logs/backend-error.log
        const logPathResult = await ssh.execCommand('pm2 show backend | grep "error log path"');
        const path = logPathResult.stdout.split('|')[1]?.trim();
        console.log("Log Path:", path);
        if (path) {
            const logs = await ssh.execCommand(`tail -n 100 ${path}`);
            fs.writeFileSync('vps_full_error.txt', logs.stdout);
            console.log("Full error logs saved.");
        } else {
            const logs = await ssh.execCommand('pm2 logs backend --lines 100 --nostream');
            fs.writeFileSync('vps_full_error.txt', logs.stdout);
            console.log("PM2 logs saved (path not found).");
        }
    } catch (err) { console.error(err); } finally { ssh.dispose(); }
}
getFullLogs();
