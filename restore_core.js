const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function restorePackages() {
    try {
        console.log('Connecting to Hostinger VPS to restore packages...');
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('1. Restoring Account Tiers (Plans)...');
        const planRes = await ssh.execCommand('node scripts/seed_plans_v2.js', { cwd: '/var/www/man2man/backend' });
        console.log(planRes.stdout || planRes.stderr);
        
        console.log('2. Restoring Staking Packages...');
        // We can run a one-line node command to call the seeding function directly
        const stakeRes = await ssh.execCommand('node -e "require(\'./modules/staking/StakingService\').seedDefaultPools().then(() => process.exit())"', { cwd: '/var/www/man2man/backend' });
        console.log(stakeRes.stdout || stakeRes.stderr);

        console.log('\n✅ Core Packages Restored.');
        ssh.dispose();
    } catch (err) {
        console.error('Restore Failed:', err);
        ssh.dispose();
    }
}

restorePackages();
