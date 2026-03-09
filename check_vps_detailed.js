const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkVps() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
        });

        console.log("--- Checking Model File ---");
        const modelCheck = await ssh.execCommand('ls -lh /var/www/man2man/backend/models/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf');
        console.log(modelCheck.stdout || modelCheck.stderr);

        console.log("--- Checking PM2 Backend Log Paths ---");
        const pm2Show = await ssh.execCommand('pm2 show backend');
        const errPathMatch = pm2Show.stdout.match(/error log path\s+\| (.*) \|/);
        const outPathMatch = pm2Show.stdout.match(/out log path\s+\| (.*) \|/);

        const errPath = errPathMatch ? errPathMatch[1].trim() : null;
        const outPath = outPathMatch ? outPathMatch[1].trim() : null;

        console.log("Error Log Path:", errPath);
        console.log("Out Log Path:", outPath);

        if (errPath) {
            console.log("--- Tail Error Log ---");
            const errLog = await ssh.execCommand(`tail -n 50 ${errPath}`);
            console.log(errLog.stdout);
        }

        if (outPath) {
            console.log("--- Tail Out Log ---");
            const outLog = await ssh.execCommand(`tail -n 50 ${outPath}`);
            console.log(outLog.stdout);
        }

    } catch (err) {
        console.error("SSH Error:", err);
    } finally {
        ssh.dispose();
    }
}

checkVps();
