const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function finalVerification() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
        });

        console.log("--- PM2 Final Status ---");
        const status = await ssh.execCommand('pm2 status');
        console.log(status.stdout);

        console.log("--- Port Listen Check ---");
        const ports = await ssh.execCommand('netstat -tuln | grep -E "3000|5050"');
        console.log(ports.stdout || "No ports listening!");

        console.log("--- Testing Backend API ---");
        const api = await ssh.execCommand('curl -i http://localhost:5050/api/auth/me');
        console.log("API Auth/Me:", api.stdout.split('\n')[0]); // First line of response

        console.log("--- Testing AI Chat (Wait 10s for model load) ---");
        // We wait a bit manually in this script if needed, but let's try a direct call first
        const chat = await ssh.execCommand('curl -s -X POST http://localhost:5050/api/chat -H "Content-Type: application/json" -d "{\\\"message\\\": \\\"Hi!\\\"}"');
        console.log("Chat Reply:", chat.stdout);

    } catch (err) {
        console.error("Verification failed:", err);
    } finally {
        ssh.dispose();
    }
}

finalVerification();
