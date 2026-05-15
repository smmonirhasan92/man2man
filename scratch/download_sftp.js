const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const localFile = path.join(__dirname, 'vps_ReferralController.js');
const remoteFile = '/var/www/man2man/backend/modules/referral/ReferralController.js';

conn.on('ready', () => {
    console.log('--- SSH Connection Established ---');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        console.log('SFTP session started');
        sftp.fastGet(remoteFile, localFile, (err) => {
            if (err) throw err;
            console.log('File downloaded successfully!');
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
