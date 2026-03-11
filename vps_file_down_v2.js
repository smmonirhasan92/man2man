const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const fs = require('fs');

async function check() {
    await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });

    console.log('--- READING FRONTEND FILE CONTENT ---');
    const r = await ssh.execCommand('cat /var/www/man2man/frontend/components/admin/UserProfileModal.js');
    fs.writeFileSync('vps_fe_actual_v2.txt', r.stdout);
    console.log('Saved to vps_fe_actual_v2.txt');

    ssh.dispose();
}

check().catch(console.error);
