const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function finalVerify() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
        });

        console.log("--- FINAL LOGS ---");
        // We wait for the model to load in background (30s)
        console.log("Waiting 30s for model load...");
        await new Promise(r => setTimeout(r, 30000));

        const logs = await ssh.execCommand('pm2 logs man2man-backend --lines 100 --nostream --no-colors');
        console.log("LOGS:\n", logs.stdout);

        console.log("--- TRIGGERING FINAL CHAT ---");
        const chatContent = JSON.stringify({ message: "Hello! Is USA Affiliate secure?" });
        const curlRes = await ssh.execCommand(`curl -s -X POST http://localhost:5050/api/chat -H "Content-Type: application/json" -d '${chatContent}'`);
        console.log("CURL Response:", curlRes.stdout);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        ssh.dispose();
    }
}

finalVerify();
