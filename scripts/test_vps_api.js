const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function testApi() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
        });

        console.log("Testing /api/chat endpoint...");
        const curlCmd = `curl -s -X POST http://localhost:5050/api/chat -H "Content-Type: application/json" -d '{"message": "Hello"}'`;
        const result = await ssh.execCommand(curlCmd);
        console.log("RESPONSE BODY:\n", result.stdout);
        console.log("RESPONSE ERR:\n", result.stderr);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        ssh.dispose();
    }
}

testApi();
