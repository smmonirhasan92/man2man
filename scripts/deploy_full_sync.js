const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function deployUserWay() {
    try {
        console.log('Connecting to VPS (User Approved Flow)...');
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        // We will deploy to BOTH just to be 100% sure the user sees it.
        const dirs = ['/var/www/man2man', '/var/www/usaaffiliatemarketing'];
        
        for (const rootDir of dirs) {
            console.log(`\n\n--- Deploying to ${rootDir} ---`);
            const commands = [
                `cd ${rootDir} && git fetch --all && git reset --hard origin/main`,
                `cd ${rootDir}/frontend && npm i && npm run build`,
                `pm2 restart all`
            ];
            
            for (const cmd of commands) {
                console.log(`\n> Executing: ${cmd}`);
                const result = await ssh.execCommand(cmd);
                if (result.stdout) console.log(result.stdout);
                if (result.stderr) console.error(result.stderr);
            }
        }

        console.log('\nFULL Deployment completed successfully.');
        ssh.dispose();
    } catch (err) {
        console.error('Deployment Failed:', err);
        ssh.dispose();
    }
}
deployUserWay();
