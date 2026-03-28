const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const path = require('path');

async function sync() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('Uploading server.js...');
        await ssh.putFile('d:/man2man/backend/server.js', '/var/www/man2man/backend/server.js');
        
        console.log('Restarting PM2 backend...');
        await ssh.execCommand('pm2 restart man2man-backend');
        
        console.log('Waiting for logs...');
        setTimeout(async () => {
             console.log('--- TEST CURL ---');
             const res = await ssh.execCommand('curl -v http://127.0.0.1:5055/health');
             console.log(res.stdout);
             console.log(res.stderr);
             ssh.dispose();
        }, 5000);

    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
sync();
