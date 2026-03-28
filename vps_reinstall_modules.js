const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function reinstallModules() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('Cleaning up node_modules...');
        await ssh.execCommand('rm -rf /var/www/man2man/backend/node_modules');
        
        console.log('Running npm install on VPS...');
        const res = await ssh.execCommand('npm install --production', { cwd: '/var/www/man2man/backend' });
        console.log(res.stdout);
        console.log(res.stderr);
        
        console.log('Restarting backend...');
        await ssh.execCommand('pm2 restart man2man-backend');

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
reinstallModules();
