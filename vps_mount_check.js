const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function check() {
    await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });

    console.log('--- MOUNT CHECK ---');
    const r = await ssh.execCommand('mount | grep man2man');
    console.log(r.stdout.trim() || 'No man2man specific mounts');

    console.log('\n--- FINDING ALL .GIT DIRS ---');
    const r2 = await ssh.execCommand('find / -maxdepth 4 -name ".git" -type d 2>/dev/null');
    console.log(r2.stdout.trim());

    ssh.dispose();
}

check().catch(console.error);
