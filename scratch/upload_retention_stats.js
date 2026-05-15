const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
conn.on('ready', () => {
    console.log('--- SSH Connection Established ---');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        const localController = path.join(__dirname, '..', 'backend/controllers/userController.js');
        const remoteController = '/var/www/man2man/backend/controllers/userController.js';
        
        const localFrontend = path.join(__dirname, '..', 'frontend/components/UserManagement.js');
        const remoteFrontend = '/var/www/man2man/frontend/components/UserManagement.js';
        
        sftp.fastPut(localController, remoteController, (err) => {
            if (err) { console.error('Upload failed:', err); conn.end(); return; }
            console.log('✅ userController.js uploaded!');
            
            sftp.fastPut(localFrontend, remoteFrontend, (err) => {
                if (err) { console.error('Upload failed:', err); conn.end(); return; }
                console.log('✅ UserManagement.js uploaded!');
                
                conn.exec('cd /var/www/man2man && docker compose -f docker-compose.prod.yml up -d --build backend frontend', (err, stream) => {
                    if (err) throw err;
                    stream.on('close', () => { console.log('Done!'); conn.end(); })
                    .on('data', d => process.stdout.write(d.toString()))
                    .stderr.on('data', d => process.stderr.write(d.toString()));
                });
            });
        });
    });
}).connect({ host: '76.13.244.202', port: 22, username: 'root', password: 'Sir@@@admin123', readyTimeout: 100000 });
