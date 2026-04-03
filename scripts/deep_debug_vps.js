const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function deepDebug() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
        });

        console.log("--- Port Check (5050) ---");
        const netstat = await ssh.execCommand('netstat -tuln | grep 5050');
        console.log("Listen 5050:", netstat.stdout || "NOTHING LISTENING");

        console.log("--- Node Processes ---");
        const ps = await ssh.execCommand('ps aux | grep node | grep -v grep');
        console.log(ps.stdout || "NO NODE PROCESSES FOUND");

        console.log("--- PM2 Status ---");
        const pm2 = await ssh.execCommand('pm2 status');
        console.log(pm2.stdout);

        console.log("--- Nginx Error Log (Last 20) ---");
        const nginx = await ssh.execCommand('tail -n 20 /var/log/nginx/error.log');
        console.log(nginx.stdout);

        console.log("--- Attempting PM2 Start ---");
        const start = await ssh.execCommand('pm2 start /var/www/man2man/ecosystem.config.js');
        console.log(start.stdout);
        console.log(start.stderr);

        console.log("--- PM2 Status After Start ---");
        const status2 = await ssh.execCommand('pm2 status');
        console.log(status2.stdout);

    } catch (err) {
        console.error("SSH Error:", err);
    } finally {
        ssh.dispose();
    }
}

deepDebug();
