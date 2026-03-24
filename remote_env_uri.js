const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function readEnv() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        const result = await ssh.execCommand('grep "^DB_URI=" .env', { cwd: '/var/www/man2man/backend' });
        console.log('\n--- DB_URI ---');
        console.log(result.stdout);
        ssh.dispose();
    } catch (err) {
        console.error('Read Failed:', err);
        ssh.dispose();
    }
}

readEnv();
