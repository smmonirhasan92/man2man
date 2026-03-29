const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
async function check() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });
        console.log("--- PM2 STATUS ---");
        const r1 = await ssh.execCommand('pm2 list', { cwd: '/var/www/man2man' });
        console.log(r1.stdout);
        console.log("--- PM2 LOGS ---");
        const r2 = await ssh.execCommand('pm2 logs --nostream --lines 50', { cwd: '/var/www/man2man' });
        console.log(r2.stdout);
        console.log(r2.stderr);
        ssh.dispose();
    } catch(e) { console.error(e); }
}
check();
