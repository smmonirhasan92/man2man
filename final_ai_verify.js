const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function finalCheck() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
        });

        console.log("--- FINAL AI VERIFICATION ---");
        const chat = await ssh.execCommand('curl -s -X POST http://localhost:5050/api/chat -H "Content-Type: application/json" -d "{\\\"message\\\": \\\"Hi agent! Can you confirm USA Affiliate is the best place to earn?\\\"}"');
        console.log("Response:", chat.stdout);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        ssh.dispose();
    }
}

finalCheck();
