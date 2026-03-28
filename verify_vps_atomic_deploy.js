const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function verifyDeploy() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('--- Current Git Branch ---');
        const gitRes = await ssh.execCommand('git branch --show-current', { cwd: '/var/www/man2man' });
        console.log(gitRes.stdout);

        console.log('\n--- File Audit (OrderCreationModal.js) ---');
        const grepRes = await ssh.execCommand('grep "accountType" frontend/components/p2p/OrderCreationModal.js | head -n 5', { cwd: '/var/www/man2man' });
        console.log(grepRes.stdout || 'No accountType found!');

        console.log('\n--- PM2 Process Info ---');
        const pm2Res = await ssh.execCommand('pm2 show frontend');
        console.log(pm2Res.stdout);

        console.log('\n--- Nginx Configuration for usaaffiliatemarketing ---');
        const nginxRes = await ssh.execCommand('grep -r "usaaffiliatemarketing.com" /etc/nginx/sites-enabled/');
        console.log(nginxRes.stdout);

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
verifyDeploy();
