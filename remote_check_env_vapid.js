const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkEnv() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- CHECKING VPS .env FOR VAPID ---');
        const results = await ssh.execCommand('grep VAPID backend/.env', { cwd: '/var/www/man2man' });
        console.log(results.stdout || "VAPID keys not found in backend/.env");
        
        console.log('\n--- CHECKING FRONTEND .env FOR VAPID ---');
        const feResults = await ssh.execCommand('grep VAPID frontend/.env.local', { cwd: '/var/www/man2man' });
        console.log(feResults.stdout || "VAPID keys not found in frontend/.env.local");

        ssh.dispose();
    } catch (err) {
        console.error('Check Failed:', err);
        ssh.dispose();
    }
}

checkEnv();
