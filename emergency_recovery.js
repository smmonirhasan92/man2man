const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function fix() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log("Killing ALL Node/PM2 processes to clear blocked ports...");
        await ssh.execCommand('pm2 kill || true');
        await ssh.execCommand('killall -9 node || true');
        await ssh.execCommand('fuser -k 3000/tcp || true');
        await ssh.execCommand('fuser -k 5000/tcp || true');
        
        console.log("Starting backend...");
        await ssh.execCommand('cd /var/www/man2man/backend && pm2 start server.js --name "man2man-backend"');
        
        console.log("Starting frontend...");
        await ssh.execCommand('cd /var/www/man2man/frontend && pm2 start npm --name "frontend" -- start');
        
        console.log("Saving PM2...");
        let res = await ssh.execCommand('pm2 save');
        console.log(res.stdout);

        console.log("Site 502 recovery complete!");
        ssh.dispose();
    } catch (err) {
        console.error('Failed:', err);
        ssh.dispose();
    }
}
fix();
