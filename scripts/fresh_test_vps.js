const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function freshTest() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
        });

        console.log("--- FLUSHING LOGS ---");
        await ssh.execCommand('pm2 flush');

        console.log("--- TRIGGERING CHAT REQ ---");
        const chatContent = JSON.stringify({ message: "Hello Support!" });
        // Use double escaping for the shell command
        const curlRes = await ssh.execCommand(`curl -s -X POST http://localhost:5050/api/chat -H "Content-Type: application/json" -d '${chatContent}'`);
        console.log("CURL Response:", curlRes.stdout);

        console.log("--- WAITING 5 SECONDS FOR LOGS ---");
        await new Promise(r => setTimeout(r, 5000));

        console.log("--- GRABBING FRESH LOGS ---");
        const logs = await ssh.execCommand('pm2 logs man2man-backend --lines 200 --nostream --no-colors');
        console.log("STDOUT:\n", logs.stdout);
        console.log("STDERR:\n", logs.stderr);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        ssh.dispose();
    }
}

freshTest();
