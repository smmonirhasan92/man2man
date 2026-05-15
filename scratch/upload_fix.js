const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
conn.on('ready', () => {
    console.log('--- SSH Connection Established ---');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const localPath = path.join(__dirname, 'fix_admin_loans.js');
        const remotePath = '/var/www/man2man/backend/fix_admin_loans.js';
        sftp.fastPut(localPath, remotePath, (err) => {
            if (err) { console.error('Upload failed:', err); conn.end(); return; }
            console.log('✅ fix_admin_loans.js uploaded!');
            conn.exec('cd /var/www/man2man/backend && node fix_admin_loans.js', (err, stream) => {
                if (err) throw err;
                stream.on('close', () => { console.log('Done!'); conn.end(); })
                .on('data', d => process.stdout.write(d.toString()))
                .stderr.on('data', d => process.stderr.write(d.toString()));
            });
        });
    });
}).connect({ host: '76.13.244.202', port: 22, username: 'root', password: 'Sir@@@admin123', readyTimeout: 100000 });
