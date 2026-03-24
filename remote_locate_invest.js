const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function locateInvestFiles() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });
        
        console.log('--- FINDING INVEST FRONTEND FILES ---');
        const feFiles = await ssh.execCommand('find /var/www/man2man/frontend/app -name "*invest*"');
        console.log(feFiles.stdout || "No frontend invest files found.");
        
        console.log('\n--- FINDING INVEST/STAKING BACKEND FILES ---');
        const beFiles = await ssh.execCommand('find /var/www/man2man/backend -name "*staking*" -o -name "*invest*"');
        console.log(beFiles.stdout || "No backend staking/invest files found.");

        ssh.dispose();
    } catch (err) {
        console.error('Locate Failed:', err);
        ssh.dispose();
    }
}

locateInvestFiles();
