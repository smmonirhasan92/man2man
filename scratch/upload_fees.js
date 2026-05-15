const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
    console.log('SSH Connection Established');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        const p2pContent = fs.readFileSync('backend/modules/p2p/P2PService.js');
        const walletContent = fs.readFileSync('backend/modules/wallet/WalletService.js');
        const withdrawalContent = fs.readFileSync('backend/modules/wallet/withdrawal.controller.js');
        const transactionContent = fs.readFileSync('backend/modules/wallet/transaction.controller.js');
        
        let uploaded = 0;
        const checkDone = () => {
            uploaded++;
            if (uploaded === 4) {
                console.log('All files uploaded');
                conn.exec('cd /var/www/man2man && docker compose up -d --build backend', (err, stream) => {
                    if (err) throw err;
                    stream.on('close', () => {
                        console.log('Rebuild done');
                        conn.end();
                    }).on('data', (data) => {
                        process.stdout.write(data);
                    }).stderr.on('data', (data) => {
                        process.stderr.write(data);
                    });
                });
            }
        };

        sftp.writeFile('/var/www/man2man/backend/modules/p2p/P2PService.js', p2pContent, (err) => {
            if (err) throw err; console.log('P2PService uploaded'); checkDone();
        });
        sftp.writeFile('/var/www/man2man/backend/modules/wallet/WalletService.js', walletContent, (err) => {
            if (err) throw err; console.log('WalletService uploaded'); checkDone();
        });
        sftp.writeFile('/var/www/man2man/backend/modules/wallet/withdrawal.controller.js', withdrawalContent, (err) => {
            if (err) throw err; console.log('withdrawal.controller uploaded'); checkDone();
        });
        sftp.writeFile('/var/www/man2man/backend/modules/wallet/transaction.controller.js', transactionContent, (err) => {
            if (err) throw err; console.log('transaction.controller uploaded'); checkDone();
        });
    });
})
.connect({
    host: '76.13.244.202',
    port: 22,
    username: 'root',
    password: 'Sir@@@admin123'
});
