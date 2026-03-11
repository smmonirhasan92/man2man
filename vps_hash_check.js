const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function check() {
    await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });

    console.log('--- GIT HEAD HASH ---');
    const r = await ssh.execCommand('cd /var/www/man2man && git rev-parse HEAD');
    console.log(r.stdout.trim());

    console.log('--- LAST THREE COMMITS ---');
    const r2 = await ssh.execCommand('cd /var/www/man2man && git log -n 3 --oneline');
    console.log(r2.stdout.trim());

    ssh.dispose();
}

check().catch(console.error);
