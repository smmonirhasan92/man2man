const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function readLogs() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
        });

        console.log("--- Tail Error Log ---");
        const errLog = await ssh.execCommand('tail -n 100 /root/.pm2/logs/backend-error.log');
        console.log(errLog.stdout || "Error log empty or not found");

        console.log("--- Tail Out Log ---");
        const outLog = await ssh.execCommand('tail -n 100 /root/.pm2/logs/backend-out.log');
        console.log(outLog.stdout || "Out log empty or not found");

    } catch (err) {
        console.error("SSH Error:", err);
    } finally {
        ssh.dispose();
    }
}

readLogs();
