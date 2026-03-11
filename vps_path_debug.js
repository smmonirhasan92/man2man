const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function check() {
    await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });

    console.log('--- PM2 DESCRIBE FRONTEND ---');
    const r = await ssh.execCommand('pm2 describe frontend');
    console.log(r.stdout.trim());

    console.log('\n--- SEARCHING FOR OTHER .NEXT DIRS ---');
    const r2 = await ssh.execCommand('find /var/www -name ".next" -type d');
    console.log(r2.stdout.trim());

    ssh.dispose();
}

check().catch(console.error);
