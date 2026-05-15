const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const filesToUpload = [
    { local: 'frontend/components/admin/TransactionCard.js', remote: '/var/www/man2man/frontend/components/admin/TransactionCard.js' },
    { local: 'frontend/app/admin/p2p-tribunal/page.js', remote: '/var/www/man2man/frontend/app/admin/p2p-tribunal/page.js' },
    { local: 'frontend/app/wallet/history/page.js', remote: '/var/www/man2man/frontend/app/wallet/history/page.js' }
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
