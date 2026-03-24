const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function audit() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- PM2 Status ---');
        const res = await ssh.execCommand('pm2 status');
        console.log(res.stdout);

        console.log('--- PM2 Describe man2man-frontend ---');
        const res2 = await ssh.execCommand('pm2 describe man2man-frontend');
        console.log(res2.stdout);

        console.log('--- Current Directory Content ---');
        const res3 = await ssh.execCommand('ls -la /var/www/man2man/frontend');
        console.log(res3.stdout);

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
audit();
