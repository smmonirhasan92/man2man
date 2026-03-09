const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function testChat() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
        });

        console.log("--- Testing /api/chat ---");
        const res = await ssh.execCommand('curl -s -X POST http://localhost:5050/api/chat -H "Content-Type: application/json" -d "{\\\"message\\\": \\\"Hello!\\\"}"');
        console.log("Response:", res.stdout);

    } catch (err) {
        console.error("SSH Error:", err);
    } finally {
        ssh.dispose();
    }
}

testChat();
