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

        const commands = [
            'pm2 logs man2man-backend --lines=50 --nostream'
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
