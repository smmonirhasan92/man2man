const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const ssh = new NodeSSH();
async function run() {
    await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });
    const r = await ssh.execCommand('cd /var/www/man2man/frontend && export NODE_OPTIONS=--max_old_space_size=512 && npm run build');
    fs.writeFileSync('d:\\man2man\\build_logs.txt', 'CODE: ' + r.code + '\nOUT: ' + r.stdout + '\nERR: ' + r.stderr);
    ssh.dispose();
}
run();
