const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function fixPM2() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log("Fixing PM2 paths...");
        const res = await ssh.execCommand('pm2 delete frontend || true && cd /var/www/man2man/frontend && pm2 start npm --name "frontend" -- start && pm2 save');
        console.log("Result:", res.stdout);
        if(res.stderr) console.error("Error:", res.stderr);

        ssh.dispose();
    } catch (err) {
        console.error('Failed:', err);
        ssh.dispose();
    }
}
fixPM2();
