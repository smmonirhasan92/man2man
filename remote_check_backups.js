const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkBackups() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- SEARCHING FOR BACKUPS ---');
        // Check common backup locations
        const results = await ssh.execCommand('find / -name "*.gz" -o -name "*.archive" -o -name "backup*" | grep "mongo" | head -n 20');
        console.log(results.stdout || "No obvious backups found.");
        
        console.log('\n--- CHECKING CRON JOBS ---');
        const cron = await ssh.execCommand('crontab -l');
        console.log(cron.stdout || "No crontab found.");
        
        ssh.dispose();
    } catch (err) {
        console.error('Search Failed:', err);
        ssh.dispose();
    }
}

checkBackups();
