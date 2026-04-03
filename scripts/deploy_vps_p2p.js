const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function deployToVPS() {
    try {
        console.log('Connecting to VPS...');
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('Connected! Initiating secure automated deployment...');
        
        const commands = [
            'cd /var/www/man2man && git pull origin main',
            'cd /var/www/man2man && npm install',
            'cd /var/www/man2man/frontend && npm install',
            'cd /var/www/man2man/frontend && npm run build',
            'cd /var/www/man2man && pm2 restart all'
        ];

        for (const cmd of commands) {
            console.log(`\nRunning: ${cmd}`);
            const res = await ssh.execCommand(cmd);
            if (res.stdout) console.log(`[STDOUT]\n${res.stdout}`);
            if (res.stderr) console.error(`[STDERR]\n${res.stderr}`);
        }
        
        console.log('\nDeployment Complete!');
        ssh.dispose();
    } catch (err) {
        console.error('Deployment Failed:', err);
        ssh.dispose();
    }
}
deployToVPS();
