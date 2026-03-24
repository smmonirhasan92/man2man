const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function downloadInvestModule() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });
        
        const files = [
            { remote: '/var/www/man2man/backend/routes/stakingRoutes.js', local: 'd:/man2man/vps_staking_routes.js' },
            { remote: '/var/www/man2man/backend/controllers/StakingController.js', local: 'd:/man2man/vps_staking_controller.js' },
            { remote: '/var/www/man2man/backend/models/StakingPoolModel.js', local: 'd:/man2man/vps_staking_pool_model.js' },
            { remote: '/var/www/man2man/frontend/app/dashboard/invest/page.js', local: 'd:/man2man/vps_invest_page.js' }
        ];

        for (const file of files) {
            try {
                await ssh.getFile(file.local, file.remote);
                console.log(`✅ Downloaded: ${file.remote}`);
            } catch (e) {
                console.warn(`❌ Could not download: ${file.remote}`);
            }
        }

        console.log('\n--- CHECKING DATABASE COLLECTIONS ---');
        const dbRes = await ssh.execCommand('mongosh universal_game_core_v1 --eval "db.stakingpools.countDocuments()"');
        console.log(`Staking Pools Count: ${dbRes.stdout.trim()}`);

        ssh.dispose();
    } catch (err) {
        console.error('Download Failed:', err);
        ssh.dispose();
    }
}

downloadInvestModule();
