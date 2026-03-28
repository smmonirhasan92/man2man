const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

ssh.connect({
    host: '76.13.244.202',
    username: 'root',
    password: 'Sir@@@admin123'
}).then(async () => {
    const h = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000');
    console.log('HTTP STATUS:', h.stdout);

    const p = await ssh.execCommand('pm2 list --no-color');
    console.log(p.stdout);
    
    ssh.dispose();
}).catch(e => { console.error(e.message); process.exit(1); });
