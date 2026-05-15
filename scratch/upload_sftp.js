const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const localFile = 'd:\\man2man_v2-VPS -- Meror\\frontend\\components\\referral\\ReferralDashboard.js';
const remoteFile = '/var/www/man2man/frontend/components/referral/ReferralDashboard.js';

conn.on('ready', () => {
    console.log('--- SSH Connection Established ---');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        console.log('SFTP session started');
        sftp.fastPut(localFile, remoteFile, (err) => {
            if (err) throw err;
            console.log('File uploaded successfully!');
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
