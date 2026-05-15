const { Client } = require('ssh2');
const fs = require('fs');

const filesToUpload = [
    // Frontend files
    { local: 'frontend/components/wallet/WalletSwap.js', remote: '/var/www/man2man/frontend/components/wallet/WalletSwap.js' },
    { local: 'frontend/components/wallet/RechargeForm.js', remote: '/var/www/man2man/frontend/components/wallet/RechargeForm.js' },
    { local: 'frontend/components/wallet/WithdrawForm.js', remote: '/var/www/man2man/frontend/components/wallet/WithdrawForm.js' },
    { local: 'frontend/components/p2p/P2PDashboard.js', remote: '/var/www/man2man/frontend/components/p2p/P2PDashboard.js' },
    { local: 'frontend/components/p2p/P2PChatRoom.js', remote: '/var/www/man2man/frontend/components/p2p/P2PChatRoom.js' },
    { local: 'frontend/components/p2p/OrderCreationModal.js', remote: '/var/www/man2man/frontend/components/p2p/OrderCreationModal.js' },
    // Backend files
    { local: 'backend/modules/p2p/P2PService.js', remote: '/var/www/man2man/backend/modules/p2p/P2PService.js' },
    { local: 'backend/modules/wallet/WalletService.js', remote: '/var/www/man2man/backend/modules/wallet/WalletService.js' },
    { local: 'backend/modules/wallet/withdrawal.controller.js', remote: '/var/www/man2man/backend/modules/wallet/withdrawal.controller.js' },
    { local: 'backend/modules/wallet/transaction.controller.js', remote: '/var/www/man2man/backend/modules/wallet/transaction.controller.js' },
    { local: 'backend/modules/referral/ReferralService.js', remote: '/var/www/man2man/backend/modules/referral/ReferralService.js' },
];

const conn = new Client();

conn.on('ready', () => {
    console.log('SSH Connected');
    conn.sftp((err, sftp) => {
        if (err) throw err;

        let uploaded = 0;
        const total = filesToUpload.length;

        for (const file of filesToUpload) {
            const content = fs.readFileSync(file.local);
            sftp.writeFile(file.remote, content, (err) => {
                if (err) {
                    console.error(`FAILED: ${file.local}`, err.message);
                } else {
                    console.log(`✅ ${file.local}`);
                }
                uploaded++;

                if (uploaded === total) {
                    console.log('\nAll files uploaded. Rebuilding frontend + backend...');
                    conn.exec(
                        'cd /var/www/man2man && docker compose up -d --build backend && docker compose up -d --build frontend',
                        (err, stream) => {
                            if (err) throw err;
                            stream.on('close', () => {
                                console.log('✅ Rebuild complete!');
                                conn.end();
                            }).on('data', (data) => {
                                process.stdout.write(data);
                            }).stderr.on('data', (data) => {
                                process.stderr.write(data);
                            });
                        }
                    );
                }
            });
        }
    });
}).connect({
    host: '76.13.244.202',
    port: 22,
    username: 'root',
    password: 'Sir@@@admin123'
});
