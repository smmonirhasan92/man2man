const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function check() {
    await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });

    console.log('--- PM2 LOGS (LAST 20 LINES) ---');
    const r = await ssh.execCommand('pm2 logs --lines 20 --nostream');
    console.log(r.stdout.trim());

    console.log('\n--- RAW CURL WITH HEADERS ---');
    // We try to see if it even connects
    const r2 = await ssh.execCommand('curl -i http://localhost:5050/api/admin/users?limit=1');
    console.log(r2.stdout.trim());

    ssh.dispose();
}

check().catch(console.error);
