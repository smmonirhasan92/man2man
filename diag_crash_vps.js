const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkCrash() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
        });

        console.log("--- PM2 Status ---");
        const status = await ssh.execCommand('pm2 status');
        console.log(status.stdout);

        console.log("--- PM2 Backend Logs (Last 100 lines) ---");
        // Using -nostream and -no-colors for clean output
        const logs = await ssh.execCommand('pm2 logs backend --lines 100 --nostream --no-colors');
        console.log(logs.stdout);
        console.log(logs.stderr);

    } catch (err) {
        console.error("SSH Error:", err);
    } finally {
        ssh.dispose();
    }
}

checkCrash();
