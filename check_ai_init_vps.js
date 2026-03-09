const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkAiLogs() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        console.log("--- Backend Logs (AI Init) ---");
        const logs = await ssh.execCommand('pm2 logs man2man-backend --lines 100 --nostream --no-colors');
        console.log(logs.stdout);
        console.log(logs.stderr);

        console.log("--- Model File Existence ---");
        const ls = await ssh.execCommand('ls -lh /var/www/man2man/backend/models/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf');
        console.log(ls.stdout || "MODEL NOT FOUND AT PATH");

        console.log("--- Memory Usage ---");
        const mem = await ssh.execCommand('free -m');
        console.log(mem.stdout);

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
checkAiLogs();
