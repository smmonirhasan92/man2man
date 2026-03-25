const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function deploy() {
    try {
        console.log('Connecting to Hostinger VPS...');
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('Connected! Pulling latest code and building...');

        const commands = [
            'cd /var/www/man2man && git fetch --all && git reset --hard origin/main',
            'cd /var/www/man2man && node migrate_agents.js',
            'cd /var/www/man2man/frontend && rm -rf .next && npm i && npm run build',
            'pm2 restart man2man-frontend',
            'pm2 restart man2man-backend'
        ];

        for (const cmd of commands) {
            console.log(`\n> Executing: ${cmd}`);
            const result = await ssh.execCommand(cmd, { cwd: '/var/www/man2man' });
            if (result.stdout) console.log(result.stdout);
            if (result.stderr) console.error(result.stderr);
            if (result.code !== 0) {
                console.error(`Command failed with exit code ${result.code}`);
            }
        }

        console.log('\nDeployment completed successfully.');
        ssh.dispose();
    } catch (err) {
        console.error('Deployment Failed:', err);
        ssh.dispose();
    }
}

deploy();
