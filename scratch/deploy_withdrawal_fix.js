const { Client } = require('ssh2');

const conn = new Client();
const localFrontend = 'd:\\man2man_v2-VPS -- Meror\\frontend\\components\\admin\\TransactionCard.js';
const remoteFrontend = '/var/www/man2man/frontend/components/admin/TransactionCard.js';
const localBackend = 'd:\\man2man_v2-VPS -- Meror\\backend\\modules\\wallet\\withdrawal.controller.js';
const remoteBackend = '/var/www/man2man/backend/modules/wallet/withdrawal.controller.js';

conn.on('ready', () => {
    console.log('--- SSH Connection Established ---');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        sftp.fastPut(localFrontend, remoteFrontend, (err) => {
            if (err) console.error(err);
            console.log('Frontend TransactionCard uploaded');
            
            sftp.fastPut(localBackend, remoteBackend, (err) => {
                if (err) console.error(err);
                console.log('Backend withdrawal.controller uploaded');
                conn.end();
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
