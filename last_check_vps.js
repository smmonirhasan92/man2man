const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function lastCheck() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
        });

        console.log("--- Final AI Output Test ---");
        // Simple curl with a longer timeout if needed (though local AI is usually fast after loading)
        const chat = await ssh.execCommand('curl -s -X POST http://localhost:5050/api/chat -H "Content-Type: application/json" -d "{\\\"message\\\": \\\"Why is USA Affiliate the best?\\\"}"');
        console.log("Chat Response:", chat.stdout);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        ssh.dispose();
    }
}

lastCheck();
