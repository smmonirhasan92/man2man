const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function getEnv() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        const r = await ssh.execCommand('cat /var/www/man2man/backend/.env | grep MONGODB_URI');
        console.log('ENV_OUTPUT:', r.stdout);
        ssh.dispose();
    } catch (err) {
        console.error(err);
    }
}

getEnv();
