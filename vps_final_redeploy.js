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
        
        console.log('Stopping and deleting old PM2 processes...');
        await ssh.execCommand('pm2 delete all');
        
        console.log('Starting Backend...');
        // Start backend with absolute paths and cwd
        await ssh.execCommand('pm2 start server.js --name man2man-backend --cwd /var/www/man2man/backend', { cwd: '/var/www/man2man/backend' });
        
        console.log('Starting Frontend...');
        // Start frontend with absolute paths and cwd
        await ssh.execCommand('pm2 start "npm run start" --name man2man-frontend --cwd /var/www/man2man/frontend', { cwd: '/var/www/man2man/frontend' });
        
        console.log('Restarting Nginx...');
        await ssh.execCommand('systemctl restart nginx');
        
        console.log('Waiting for processes to settle...');
        setTimeout(async () => {
            console.log('--- PM2 LIST ---');
            const res1 = await ssh.execCommand('pm2 list');
            console.log(res1.stdout);
            
            console.log('--- PORT 5055 CHECK ---');
            const res2 = await ssh.execCommand('netstat -tunlp | grep :5055');
            console.log(res2.stdout);

            console.log('--- PORT 3000 CHECK ---');
            const res3 = await ssh.execCommand('netstat -tunlp | grep :3000');
            console.log(res3.stdout);

            ssh.dispose();
        }, 5000);
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
redeploy();
