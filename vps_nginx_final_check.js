const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function nginxFinalCheck() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- NGINX CONFIG: usaaffiliatemarketing.com ---');
        const res = await ssh.execCommand('cat /etc/nginx/sites-enabled/usaaffiliatemarketing.com');
        console.log(res.stdout);
        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
nginxFinalCheck();
