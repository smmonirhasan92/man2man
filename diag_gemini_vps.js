const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkGeminiError() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
        });

        console.log("--- Reading Backend Logs for Gemini Error ---");
        // We look for "[AI] Chat Error:" which I added in the catch block
        const logs = await ssh.execCommand('pm2 logs backend --lines 50 --nostream --no-colors');
        console.log(logs.stdout);
        console.log(logs.stderr);

    } catch (err) {
        console.error("SSH Error:", err);
    } finally {
        ssh.dispose();
    }
}

checkGeminiError();
