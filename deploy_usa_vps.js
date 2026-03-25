const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function deployReal() {
    try {
        console.log('Connecting to VPS (Target: usaaffiliatemarketing)...');
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        const rootDir = '/var/www/usaaffiliatemarketing';
        
        const commands = [
            `cd ${rootDir} && git fetch --all && git reset --hard origin/main`,
            `cd ${rootDir}/frontend && npm i && npm run build`,
            `pm2 restart all || (pm2 start npm --name "frontend" -- start)`
        ];

        for (const cmd of commands) {
            console.log(`\n> Executing: ${cmd}`);
            const result = await ssh.execCommand(cmd);
            if (result.stdout) console.log(result.stdout);
            if (result.stderr) console.error(result.stderr);
        }

        console.log('\nREAL Deployment completed successfully.');
        ssh.dispose();
    } catch (err) {
        console.error('Deployment Failed:', err);
        ssh.dispose();
    }
}
deployReal();
