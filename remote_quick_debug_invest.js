const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function debugInvest() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });
        
        console.log('--- RECENT BACKEND ERRORS ---');
        const logs = await ssh.execCommand('pm2 logs remitwallet-backend --lines 50 --no-daemon');
        console.log(logs.stdout);
        
        console.log('\n--- CHECKING STAKING POOLS IN DB ---');
        const dbCheck = await ssh.execCommand('mongosh universal_game_core_v1 --eval "db.stakingpools.find().toArray()"');
        console.log(dbCheck.stdout);

        console.log('\n--- LOCATING FRONTEND INVEST PAGE ---');
        const feFind = await ssh.execCommand('find /var/www/man2man/frontend/app -name "*invest*"');
        console.log(feFind.stdout);

        ssh.dispose();
    } catch (err) {
        console.error('Debug Failed:', err);
        ssh.dispose();
    }
}

debugInvest();
