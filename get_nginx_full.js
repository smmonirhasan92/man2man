const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

ssh.connect({
    host: '76.13.244.202',
    username: 'root',
    password: 'Sir@@@admin123'
}).then(async () => {
    
    console.log('=== Full Nginx Config ===');
    const nginx = await ssh.execCommand('cat /etc/nginx/sites-enabled/default');
    console.log(nginx.stdout || 'Not found');

    console.log('\n=== Nginx sites-available ===');
    const ls = await ssh.execCommand('ls /etc/nginx/sites-available/ && ls /etc/nginx/sites-enabled/');
    console.log(ls.stdout);

    console.log('\n=== Find proxy_pass in nginx ===');
    const grep = await ssh.execCommand('grep -r "proxy_pass" /etc/nginx/');
    console.log(grep.stdout);

    ssh.dispose();
}).catch(e => { console.error(e.message); process.exit(1); });
