const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkNginx() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- Nginx Sites-Enabled Details ---');
        const res1 = await ssh.execCommand('grep -r "root" /etc/nginx/sites-enabled');
        console.log(res1.stdout);

        console.log('--- Nginx Sites-Enabled Proxy Details ---');
        const res2 = await ssh.execCommand('grep -r "proxy_pass" /etc/nginx/sites-enabled');
        console.log(res2.stdout);

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
checkNginx();
