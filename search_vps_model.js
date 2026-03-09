const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function listBackend() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
        });

        console.log("--- ls -R backend ---");
        const list = await ssh.execCommand('ls -F /var/www/man2man/backend');
        console.log(list.stdout);

        console.log("--- Searching for .gguf files ---");
        const search = await ssh.execCommand('find /var/www/man2man -name "*.gguf"');
        console.log("Search Result:", search.stdout || "None found");

    } catch (err) {
        console.error("SSH Error:", err);
    } finally {
        ssh.dispose();
    }
}

listBackend();
