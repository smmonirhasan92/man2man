const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkLogs() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });
        
        console.log('--- BACKEND PM2 LOGS (Last 50 lines) ---');
        const results = await ssh.execCommand('pm2 logs remitwallet-backend --lines 50 --no-daemon');
        console.log(results.stdout || results.stderr);
        
        ssh.dispose();
    } catch (err) {
        console.error('Check Failed:', err);
        ssh.dispose();
    }
}

checkLogs();
