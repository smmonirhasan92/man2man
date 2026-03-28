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
        const beLogs = await ssh.execCommand('pm2 logs man2man-backend --lines 50 --nostream');
        output += beLogs.stdout + '\n' + beLogs.stderr + '\n';
        
        fs.writeFileSync('server_status_backend.txt', output, 'utf8');
        console.log('Done');

        ssh.dispose();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkServer();
