const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function check() {
    await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });

    console.log('--- ENV CHECK ---');
    const r = await ssh.execCommand('cat /var/www/man2man/backend/.env | grep PORT');
    console.log(r.stdout.trim() || 'No PORT in .env');

    console.log('\n--- LISTENING PORTS (NODE) ---');
    const r2 = await ssh.execCommand('netstat -tulnp | grep node');
    console.log(r2.stdout.trim());

    console.log('\n--- PM2 STATUS ---');
    const r3 = await ssh.execCommand('pm2 list');
    console.log(r3.stdout.trim());

    ssh.dispose();
}

check().catch(console.error);
