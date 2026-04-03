const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function downloadModel() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
        });

        console.log("--- Creating models directory ---");
        await ssh.execCommand('mkdir -p /var/www/man2man/backend/models');

        console.log("--- Downloading TinyLlama (637MB) ---");
        // Using -c to resume if interrupted
        const download = await ssh.execCommand('wget -c https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf -O /var/www/man2man/backend/models/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf');
        console.log(download.stdout || "Download started/completed");
        console.log(download.stderr);

        console.log("--- Verifying File ---");
        const verify = await ssh.execCommand('ls -lh /var/www/man2man/backend/models/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf');
        console.log(verify.stdout);

    } catch (err) {
        console.error("SSH Error:", err);
    } finally {
        ssh.dispose();
    }
}

downloadModel();
