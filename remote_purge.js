const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function runPurge() {
    try {
        console.log('Connecting to Hostinger VPS to run PURGE script...');
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('Executing: cd /var/www/man2man/backend && node scripts/final_production_purge.js');
        const result = await ssh.execCommand('node scripts/final_production_purge.js', { cwd: '/var/www/man2man/backend' });
        
        console.log('\n--- PURGE OUTPUT ---');
        console.log(result.stdout);
        
        if (result.stderr) {
            console.log('\n--- ERRORS ---');
            console.log(result.stderr);
        }

        ssh.dispose();
    } catch (err) {
        console.error('Purge Failed:', err);
        ssh.dispose();
    }
}

runPurge();
