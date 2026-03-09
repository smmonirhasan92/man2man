const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const fs = require('fs');

async function getEnv() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
        });

        console.log("Reading .env...");
        const result = await ssh.execCommand('cat backend/.env', { cwd: '/var/www/man2man' });
        fs.writeFileSync('vps_env_check.txt', result.stdout);
        console.log("Env saved to vps_env_check.txt");

    } catch (err) {
        console.error("Error:", err);
    } finally {
        ssh.dispose();
    }
}

getEnv();
