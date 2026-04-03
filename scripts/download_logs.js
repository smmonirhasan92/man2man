const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function downloadLogs() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('--- DOWNLOADING PM2 ERROR LOG ---');
        // Get the specific error log file (pm2 usually uses an index, try without index first or glob)
        // First let's find the exact name
        const ls = await ssh.execCommand('ls -1 /root/.pm2/logs/man2man-backend-error*.log | head -n 1');
        const errLogFile = ls.stdout.trim();
        if (errLogFile) {
            console.log("Found log file:", errLogFile);
            await ssh.getFile('d:\\man2man\\remote_error.log', errLogFile);
            console.log("Downloaded successfully.");
        } else {
            console.log("Log file not found.");
        }

        ssh.dispose();
    } catch (err) {
        console.log("Error:", err);
    }
}
downloadLogs();
