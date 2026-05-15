const { Client } = require('ssh2');

const conn = new Client();
const localFile = 'd:\\man2man_v2-VPS -- Meror\\scratch\\clean_orphan_transactions.js';
const remoteFile = '/var/www/man2man/backend/clean_orphan_transactions.js';

conn.on('ready', () => {
    console.log('--- SSH Connection Established ---');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        sftp.fastPut(localFile, remoteFile, (err) => {
            if (err) throw err;
            console.log('clean_orphan_transactions.js uploaded');
            conn.end();
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
