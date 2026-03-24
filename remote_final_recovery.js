const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function runFinalRecovery() {
    try {
        console.log('Connecting to Hostinger VPS for Final Recovery...');
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('Uploading recovery script to VPS...');
        await ssh.putFile('d:/man2man/vps_recovery.js', '/var/www/man2man/backend/temp_recovery.js');
        
        console.log('Executing recovery script...');
        const runRes = await ssh.execCommand('node temp_recovery.js', { cwd: '/var/www/man2man/backend' });
        console.log(runRes.stdout);
        
        if (runRes.stderr) {
            console.log('\n--- ERRORS ---');
            console.log(runRes.stderr);
        }

        ssh.dispose();
    } catch (err) {
        console.error('Full Recovery Failed:', err);
        ssh.dispose();
    }
}

runFinalRecovery();
