const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
conn.on('ready', () => {
    console.log('--- SSH Connection Established ---');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        const localModal = path.join(__dirname, '..', 'frontend/components/admin/UserProfileModal.js');
        const remoteModal = '/var/www/man2man/frontend/components/admin/UserProfileModal.js';
        
        sftp.fastPut(localModal, remoteModal, (err) => {
            if (err) { console.error('Upload failed:', err); conn.end(); return; }
            console.log('✅ UserProfileModal.js uploaded (API FIX)!');
            
            conn.exec('cd /var/www/man2man && docker compose -f docker-compose.prod.yml up -d --build frontend', (err, stream) => {
                if (err) throw err;
                stream.on('close', () => { console.log('Done!'); conn.end(); })
                .on('data', d => process.stdout.write(d.toString()))
                .stderr.on('data', d => process.stderr.write(d.toString()));
            });
        });
    });
}).connect({ host: '76.13.244.202', port: 22, username: 'root', password: 'Sir@@@admin123', readyTimeout: 100000 });
