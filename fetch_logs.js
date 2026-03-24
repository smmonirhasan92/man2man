const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function fetchLogs() {
    try {
        console.log('Connecting to Hostinger VPS to fetch RAW logs...');
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('\\n--- FRONTEND ERROR LOGS ---');
        const feErr = await ssh.execCommand('tail -n 150 /root/.pm2/logs/man2man-frontend-error.log');
        console.log(feErr.stdout || feErr.stderr || 'No frontend errors');

        console.log('\\n--- FRONTEND OUT LOGS ---');
        const feOut = await ssh.execCommand('tail -n 150 /root/.pm2/logs/man2man-frontend-out.log');
        console.log(feOut.stdout || 'No frontend out logs');

        console.log('\\n--- BACKEND ERROR LOGS ---');
        const beErr = await ssh.execCommand('tail -n 150 /root/.pm2/logs/man2man-backend-error.log');
        console.log(beErr.stdout || beErr.stderr || 'No backend errors');

        ssh.dispose();
    } catch (err) {
        console.error('Fetch Failed:', err);
        ssh.dispose();
    }
}

fetchLogs();
