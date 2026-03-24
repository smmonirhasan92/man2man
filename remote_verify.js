const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function verifyUsers() {
    try {
        console.log('Connecting to Hostinger VPS to verify users...');
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('Executing: cd /var/www/man2man/backend && node scripts/debug_list_users.js');
        const result = await ssh.execCommand('node scripts/debug_list_users.js', { cwd: '/var/www/man2man/backend' });
        
        console.log('\n--- USER LIST OUTPUT ---');
        console.log(result.stdout);
        
        if (result.stderr) {
            console.log('\n--- ERRORS ---');
            console.log(result.stderr);
        }

        ssh.dispose();
    } catch (err) {
        console.error('Verification Failed:', err);
        ssh.dispose();
    }
}

verifyUsers();
