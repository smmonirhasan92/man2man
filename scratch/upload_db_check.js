const { Client } = require('ssh2');

const conn = new Client();
const localFile = 'd:\\man2man_v2-VPS -- Meror\\scratch\\check_db_integrity.js';
const remoteFile = '/var/www/man2man/backend/check_db_integrity.js';

conn.on('ready', () => {
    console.log('--- SSH Connection Established ---');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        sftp.fastPut(localFile, remoteFile, (err) => {
            if (err) throw err;
            console.log('check_db_integrity.js uploaded');
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
