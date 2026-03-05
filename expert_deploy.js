const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function forceDeploy() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('--- REBUILDING FRONTEND EXPERTLY ---');
        // Delete .next to force a totally clean build, and restart PM2
        await ssh.execCommand('rm -rf .next && npm run build', { cwd: '/var/www/man2man/frontend' });

        console.log('--- RESTARTING PM2 ---');
        await ssh.execCommand('pm2 restart all', { cwd: '/var/www/man2man' });

        console.log('Expert Deploy Finished.');

        ssh.dispose();
    } catch (err) {
        console.log(err);
    }
}
forceDeploy();
