const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const fs = require('fs');

async function check() {
    try {
        await ssh.connect({host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22});
        
        let out = '\n--- BACKEND LOGS ---\n';
        let res = await ssh.execCommand('pm2 logs man2man-backend --nostream --lines 200');
        out += res.stdout + '\n' + res.stderr + '\n';
        
        fs.writeFileSync('backend_trace.txt', out, 'utf8');
        ssh.dispose();
    } catch(e) {
        console.error(e);
        ssh.dispose();
    }
}
check();
