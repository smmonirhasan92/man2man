const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function auditLive() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('--- 1. Nginx Detailed Audit ---');
        const nginxRes = await ssh.execCommand('grep -r "proxy_pass" /etc/nginx/sites-enabled/');
        console.log(nginxRes.stdout);

        console.log('\n--- 2. PM2 Detailed Audit ---');
        const pm2Res = await ssh.execCommand('pm2 jlist');
        const apps = JSON.parse(pm2Res.stdout);
        apps.forEach(app => {
            console.log(`App: ${app.name}, Status: ${app.pm2_env.status}, CWD: ${app.pm2_env.pm_cwd}, Port: ${app.pm2_env.PORT || '3000?'}`);
        });

        console.log('\n--- 3. Port 3000 Audit ---');
        const portRes = await ssh.execCommand('lsof -i :3000');
        console.log(portRes.stdout || 'Nothing on port 3000!');

        console.log('\n--- 4. Code Search for "accountType" in ALL /var/www ---');
        const findRes = await ssh.execCommand('grep -r "accountType" /var/www/ | grep OrderCreationModal.js | head -n 5');
        console.log(findRes.stdout || 'No accountType in any OrderCreationModal.js in /var/www!');

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
auditLive();
