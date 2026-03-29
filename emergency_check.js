const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkDeploy() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log("Checking PM2 status...");
        let res = await ssh.execCommand('pm2 status');
        console.log("STATUS:\n", res.stdout);

        console.log("Checking PM2 logs for frontend...");
        res = await ssh.execCommand('pm2 logs frontend --lines 20 --nostream');
        console.log("LOGS:\n", res.stdout);
        
        ssh.dispose();
    } catch (err) {
        console.error('Failed:', err);
        ssh.dispose();
    }
}
checkDeploy();
