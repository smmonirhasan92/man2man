const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const ssh = new NodeSSH();

async function checkServer() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        let output = '';
        output += '--- BACKEND LOGS ---\n';
        const beLogs = await ssh.execCommand('pm2 logs remitwallet-backend --lines 50 --nostream');
        output += beLogs.stdout + '\n' + beLogs.stderr + '\n';
        
        output += '\n--- FRONTEND LOGS ---\n';
        const feLogs = await ssh.execCommand('pm2 logs frontend --lines 50 --nostream');
        output += feLogs.stdout + '\n' + feLogs.stderr + '\n';
        
        output += '\n--- PM2 STATUS ---\n';
        const pm2Status = await ssh.execCommand('pm2 status');
        output += pm2Status.stdout + '\n';

        fs.writeFileSync('server_status_clean.txt', output, 'utf8');
        console.log('Done mapping logs to server_status_clean.txt');

        ssh.dispose();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkServer();
