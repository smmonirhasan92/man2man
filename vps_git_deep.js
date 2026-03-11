const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function check() {
    await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });

    console.log('--- GIT REMOTES ---');
    const r = await ssh.execCommand('cd /var/www/man2man && git remote -v');
    console.log(r.stdout.trim());

    console.log('\n--- GIT BRANCH ---');
    const r2 = await ssh.execCommand('cd /var/www/man2man && git branch');
    console.log(r2.stdout.trim());

    console.log('\n--- GIT LOG (VERBOSE) ---');
    const r3 = await ssh.execCommand('cd /var/www/man2man && git log -n 1 --pretty=format:"%H %ae %s"');
    console.log(r3.stdout.trim());

    ssh.dispose();
}

check().catch(console.error);
