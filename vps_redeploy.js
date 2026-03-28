const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function redeploy() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('Starting Backend...');
        await ssh.execCommand('pm2 start server.js --name man2man-backend', { cwd: '/var/www/man2man/backend' });
        
        console.log('Starting Frontend...');
        await ssh.execCommand('pm2 start "npm run start" --name man2man-frontend', { cwd: '/var/www/man2man/frontend' });
        
        console.log('Restarting Nginx...');
        await ssh.execCommand('systemctl restart nginx');
        
        console.log('--- PM2 LIST ---');
        const res = await ssh.execCommand('pm2 list');
        console.log(res.stdout);

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
redeploy();
