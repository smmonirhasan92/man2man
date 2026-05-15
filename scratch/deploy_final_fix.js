const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
conn.on('ready', () => {
    console.log('--- SSH Connection Established ---');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        const files = [
            { 
                local: path.join(__dirname, '..', 'backend/modules/wallet/withdrawal.controller.js'), 
                remote: '/var/www/man2man/backend/modules/wallet/withdrawal.controller.js' 
            },
            { 
                local: path.join(__dirname, '..', 'frontend/app/admin/withdrawals/page.js'), 
                remote: '/var/www/man2man/frontend/app/admin/withdrawals/page.js' 
            }
        ];

        let completed = 0;
        files.forEach(f => {
            sftp.fastPut(f.local, f.remote, (err) => {
                if (err) { console.error(`Upload failed for ${f.local}:`, err); conn.end(); return; }
                console.log(`✅ Uploaded: ${path.basename(f.remote)}`);
                completed++;
                if (completed === files.length) {
                    console.log('--- Starting Docker Rebuild ---');
                    conn.exec('cd /var/www/man2man && docker compose -f docker-compose.prod.yml up -d --build backend frontend', (err, stream) => {
                        if (err) throw err;
                        stream.on('close', () => { console.log('Done!'); conn.end(); })
                        .on('data', d => process.stdout.write(d.toString()))
                        .stderr.on('data', d => process.stderr.write(d.toString()));
                    });
                }
            });
        });
    });
}).connect({ host: '76.13.244.202', port: 22, username: 'root', password: 'Sir@@@admin123', readyTimeout: 100000 });
