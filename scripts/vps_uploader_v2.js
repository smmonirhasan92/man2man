const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const filesToUpload = [
    { local: 'backend/Dockerfile', remote: '/root/backend/Dockerfile' },
    { local: 'frontend/Dockerfile', remote: '/root/frontend/Dockerfile' },
    { local: 'docker-compose.prod.yml', remote: '/root/docker-compose.prod.yml' },
    { local: 'scripts/deploy_vps.sh', remote: '/root/scripts/deploy.sh' },
    { local: 'frontend/app/dashboard/page.js', remote: '/root/man2man_v2-VPS/frontend/app/dashboard/page.js' },
    { local: 'frontend/app/admin/dashboard/page.js', remote: '/root/man2man_v2-VPS/frontend/app/admin/dashboard/page.js' }
];

conn.on('ready', () => {
    console.log('--- SFTP Connection Ready ---');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        let completed = 0;
        filesToUpload.forEach(file => {
            console.log(`Uploading ${file.local} -> ${file.remote}...`);
            const readStream = fs.createReadStream(file.local);
            const writeStream = sftp.createWriteStream(file.remote);
            
            writeStream.on('close', () => {
                console.log(`✅ Uploaded: ${file.local}`);
                completed++;
                if (completed === filesToUpload.length) {
                    console.log('🚀 ALL FILES UPLOADED SUCCESSFULLY.');
                    conn.end();
                }
            });
            
            readStream.pipe(writeStream);
        });
    });
}).on('error', (err) => {
    console.error('Connection Error: ' + err);
}).connect({
    host: '76.13.244.202',
    port: 22,
    username: 'root',
    password: 'Sir@@@admin123'
});
