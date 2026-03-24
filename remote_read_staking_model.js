const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function readFile() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        const result = await ssh.execCommand('cat modules/staking/StakingPoolModel.js', { cwd: '/var/www/man2man/backend' });
        console.log('\n--- StakingPoolModel.js CONTENT ---');
        console.log(result.stdout);
        ssh.dispose();
    } catch (err) {
        console.error('Read Failed:', err);
        ssh.dispose();
    }
}

readFile();
