const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkInvestIssue() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });
        
        console.log('--- STAKING POOL COUNT ---');
        const countRes = await ssh.execCommand('mongosh universal_game_core_v1 --eval "db.stakingpools.countDocuments()"');
        console.log(countRes.stdout);
        
        console.log('\n--- BACKEND LOGS (STAKING ERRORS) ---');
        const logsRes = await ssh.execCommand('pm2 logs remitwallet-backend --lines 100 --no-daemon | grep -i "staking\\|invest"');
        console.log(logsRes.stdout || "No specific staking errors found in recent logs.");

        ssh.dispose();
    } catch (err) {
        console.error('Check Failed:', err);
        ssh.dispose();
    }
}

checkInvestIssue();
