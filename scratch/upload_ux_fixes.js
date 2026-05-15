const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const filesToUpload = [
    { local: 'backend/routes/adminRoutes.js', remote: '/var/www/man2man/backend/routes/adminRoutes.js' },
    { local: 'backend/modules/wallet/withdrawal.controller.js', remote: '/var/www/man2man/backend/modules/wallet/withdrawal.controller.js' },
    { local: 'frontend/components/wallet/WalletSwap.js', remote: '/var/www/man2man/frontend/components/wallet/WalletSwap.js' },
    { local: 'frontend/context/NotificationContext.js', remote: '/var/www/man2man/frontend/context/NotificationContext.js' }
];

conn.on('ready', () => {
    console.log('--- SSH Connection Established ---');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        let completed = 0;
        filesToUpload.forEach(file => {
            const localPath = path.join(__dirname, '..', file.local);
            sftp.fastPut(localPath, file.remote, (err) => {
                if (err) {
                    console.error(`Failed: ${file.local}`, err);
                } else {
                    console.log(`Uploaded: ${file.local} -> ${file.remote}`);
                }
                completed++;
                if (completed === filesToUpload.length) {
                    console.log('All files uploaded successfully!');
                    conn.end();
                }
            });
        });
    });
}).on('error', (err) => {
    console.error('Connection Error: ' + err);
}).connect({
    host: '76.13.244.202',
    port: 22,
    username: 'root',
    password: 'Sir@@@admin123',
    readyTimeout: 100000
});
