const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function nginxPortCheck() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- NGINX PROXY PASS LINES ---');
        const res = await ssh.execCommand('grep -r "proxy_pass" /etc/nginx/sites-enabled');
        console.log(res.stdout);
        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
nginxPortCheck();
