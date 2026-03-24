const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function downloadInvestFiles() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });
        
        // List of files to download based on common naming patterns
        const filesToDownload = [
            { remote: '/var/www/man2man/frontend/app/dashboard/invest/page.js', local: 'd:/man2man/vps_invest_page.js' },
            { remote: '/var/www/man2man/backend/routes/stakingRoutes.js', local: 'd:/man2man/vps_staking_routes.js' },
            { remote: '/var/www/man2man/backend/controllers/StakingController.js', local: 'd:/man2man/vps_staking_controller.js' },
            { remote: '/var/www/man2man/backend/services/StakingService.js', local: 'd:/man2man/vps_staking_service.js' },
            { remote: '/var/www/man2man/backend/models/StakingPoolModel.js', local: 'd:/man2man/vps_staking_pool_model.js' },
            { remote: '/var/www/man2man/backend/models/UserStakeModel.js', local: 'd:/man2man/vps_user_stake_model.js' }
        ];

        for (const file of filesToDownload) {
            try {
                await ssh.getFile(file.local, file.remote);
                console.log(`✅ Downloaded: ${file.remote}`);
            } catch (e) {
                console.warn(`❌ Could not download: ${file.remote} - check path.`);
            }
        }

        ssh.dispose();
    } catch (err) {
        console.error('Download Failed:', err);
        ssh.dispose();
    }
}

downloadInvestFiles();
