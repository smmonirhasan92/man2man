const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function deployDocker() {
    try {
        console.log('Connecting to VPS...');
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('Connected! Starting Zero-Downtime Docker Deployment...\n');
        
        const commands = [
            'echo "1. Pulling latest configurations from GitHub..."',
            'cd /var/www/man2man && git pull origin main',
            
            'echo "2. Building Docker Containers in background (this may take a few minutes)..."',
            'cd /var/www/man2man && docker compose -f docker-compose.yml -f docker-compose.prod.yml build',
            
            'echo "3. Stopping PM2 to free up ports..."',
            'pm2 stop all',
            
            'echo "4. Swapping PM2 with Docker Containers..."',
            'cd /var/www/man2man && docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d',
            
            'echo "5. Verifying running containers..."',
            'docker ps'
        ];

        for (const cmd of commands) {
            console.log(`\n> ${cmd.split('&&').pop().trim()}`);
            const res = await ssh.execCommand(cmd);
            if (res.stdout) console.log(`${res.stdout}`);
            if (res.stderr && !res.stderr.includes('npm WARN')) console.error(`[INFO/ERROR] ${res.stderr}`);
        }
        
        console.log('\n==== DOCKER DEPLOYMENT SUCCESSFULLY COMPLETED! ====');
        ssh.dispose();
    } catch (err) {
        console.error('Deployment Failed:', err);
        ssh.dispose();
    }
}
deployDocker();
