const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function finalVerify() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
        });

        console.log("--- PM2 Status ---");
        const status = await ssh.execCommand('pm2 status');
        console.log(status.stdout);

        console.log("--- Testing API Auth (Base check) ---");
        const auth = await ssh.execCommand('curl -s http://localhost:5050/api/auth/me');
        console.log("Auth Status:", auth.stdout ? "OK (Received JSON)" : "No body (Check if reaching server)");

        console.log("--- Testing AI Chat API ---");
        // We wait a bit in case model is still loading
        const chat = await ssh.execCommand('curl -s -X POST http://localhost:5050/api/chat -H "Content-Type: application/json" -d "{\\\"message\\\": \\\"Hello agent!\\\"}"');
        console.log("Chat Response:", chat.stdout);

    } catch (err) {
        console.error("Verification Error:", err);
    } finally {
        ssh.dispose();
    }
}

finalVerify();
