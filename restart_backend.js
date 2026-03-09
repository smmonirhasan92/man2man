const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function restartBackend() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
        });

        console.log("Pulling latest code...");
        await ssh.execCommand('git fetch origin main && git reset --hard origin/main', { cwd: '/var/www/man2man' });

        console.log("Restarting backend...");
        const result = await ssh.execCommand('pm2 restart backend', { cwd: '/var/www/man2man' });
        console.log("PM2 RESTART:\n", result.stdout);

        console.log("Waiting 5 seconds for boot...");
        await new Promise(r => setTimeout(r, 5000));

        console.log("Checking logs for any immediate boot errors...");
        const logResult = await ssh.execCommand('pm2 logs backend --lines 20 --nostream', { cwd: '/var/www/man2man' });
        console.log("LOGS:\n", logResult.stdout);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        ssh.dispose();
    }
}

restartBackend();
