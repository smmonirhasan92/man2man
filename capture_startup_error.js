const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function captureStartupError() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
        });

        console.log("--- Attempting manual startup to see errors ---");
        // We use a timeout because if it successful, it will hang. 
        // We just want to see if it crashes immediately.
        const result = await ssh.execCommand('node server.js', {
            cwd: '/var/www/man2man/backend',
            onStderr: (chunk) => console.log("STDERR:", chunk.toString())
        });

        console.log("STDOUT:", result.stdout);
        console.log("FINAL STDERR:", result.stderr);

    } catch (err) {
        console.error("SSH Error:", err);
    } finally {
        ssh.dispose();
    }
}

captureStartupError();
