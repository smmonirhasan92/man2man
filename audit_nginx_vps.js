const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function auditNginx() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- Nginx Sites-Enabled ---');
        const res1 = await ssh.execCommand('ls /etc/nginx/sites-enabled');
        console.log(res1.stdout);

        console.log('--- Nginx Configuration File Content ---');
        const res2 = await ssh.execCommand('cat /etc/nginx/sites-enabled/default || cat /etc/nginx/nginx.conf');
        console.log(res2.stdout);

        console.log('--- Find all .next folders ---');
        const res3 = await ssh.execCommand('find /var/www -name ".next" -type d');
        console.log(res3.stdout);

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
auditNginx();
