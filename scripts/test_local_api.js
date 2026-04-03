const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function testEndpoint() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
        });

        console.log("--- Testing /api/chat ---");
        const chat = await ssh.execCommand('curl -i -X POST http://localhost:5050/api/chat -H "Content-Type: application/json" -d "{\\\"message\\\": \\\"Hello\\\"}"');
        console.log(chat.stdout);

        console.log("--- Testing /api/auth/me ---");
        const auth = await ssh.execCommand('curl -i http://localhost:5050/api/auth/me');
        console.log(auth.stdout);

    } catch (err) {
        console.error("SSH Error:", err);
    } finally {
        ssh.dispose();
    }
}

testEndpoint();
