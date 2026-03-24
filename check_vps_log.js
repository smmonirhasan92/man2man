const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkLog() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- VPS Git Log ---');
        const res = await ssh.execCommand('cd /var/www/man2man && git log -n 5');
        console.log(res.stdout);

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
checkLog();
