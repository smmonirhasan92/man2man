const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function check() {
    await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });

    console.log('--- SEARCHING NGINX FOR MAN2MAN ---');
    const r = await ssh.execCommand('grep -r "man2man" /etc/nginx');
    console.log(r.stdout.trim());

    ssh.dispose();
}

check().catch(console.error);
