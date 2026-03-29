const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const ssh = new NodeSSH();
async function run() {
    await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });
    const r1 = await ssh.execCommand('pm2 list');
    const r2 = await ssh.execCommand('pm2 logs --nostream --lines 100');
    fs.writeFileSync('d:\\man2man\\pm2_logs.txt', r1.stdout + '\n======\n' + r2.stdout + '\n' + r2.stderr);
    ssh.dispose();
}
run();
