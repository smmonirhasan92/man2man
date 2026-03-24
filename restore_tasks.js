const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function restoreTasks() {
    try {
        console.log('Connecting to Hostinger VPS to restore tasks...');
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('Executing: node scripts/seed_tasks_v2.js');
        const result = await ssh.execCommand('node scripts/seed_tasks_v2.js', { cwd: '/var/www/man2man/backend' });
        
        console.log('\n--- TASK SEED OUTPUT ---');
        console.log(result.stdout);
        
        if (result.stderr) {
            console.log('\n--- ERRORS ---');
            console.log(result.stderr);
        }

        ssh.dispose();
    } catch (err) {
        console.error('Task Restore Failed:', err);
        ssh.dispose();
    }
}

restoreTasks();
