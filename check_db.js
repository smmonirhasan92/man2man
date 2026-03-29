const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const fs = require('fs');

async function fixBackend() {
    try {
        console.log("Connecting...");
        await ssh.connect({host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22});
        
        let out = '';
        
        console.log("Killing anything on port 5050...");
        await ssh.execCommand('fuser -k 5050/tcp || true');
        
        console.log("Deleting old PM2 tasks...");
        await ssh.execCommand('pm2 delete all');
        
        console.log("Starting ecosystem...");
        let res = await ssh.execCommand('cd /var/www/man2man && pm2 start ecosystem.config.js && pm2 save');
        out += res.stdout + '\n';
        
        console.log("Waiting 3 seconds...");
        await new Promise(r => setTimeout(r, 3000));
        
        console.log("Checking backend logs...");
        res = await ssh.execCommand('pm2 logs man2man-backend --nostream --lines 100');
        out += '\n--- BACKEND LOGS ---\n' + res.stdout + '\n' + res.stderr + '\n';
        
        fs.writeFileSync('check_db_out.txt', out, 'utf8');
        console.log('Fixed! Wrote to check_db_out.txt');
        ssh.dispose();
    } catch(e) {
        console.error(e);
        ssh.dispose();
    }
}
fixBackend();
