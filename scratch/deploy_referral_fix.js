const { Client } = require('ssh2');
const fs = require('fs');

const filesToUpload = [
    { local: 'backend/controllers/adminController.js', remote: '/var/www/man2man/backend/controllers/adminController.js' },
    { local: 'frontend/components/admin/UserProfileModal.js', remote: '/var/www/man2man/frontend/components/admin/UserProfileModal.js' }
];

const conn = new Client();
conn.on('ready', () => {
    console.log('SSH Connected');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        let uploaded = 0;
        filesToUpload.forEach(file => {
            const content = fs.readFileSync(file.local);
            sftp.writeFile(file.remote, content, (err) => {
                if (err) throw err;
                console.log(`✅ ${file.local} uploaded`);
                uploaded++;
                if (uploaded === filesToUpload.length) {
                    console.log('Rebuilding containers...');
                    conn.exec(
                        'cd /var/www/man2man && docker compose up -d --build backend && docker compose up -d --build frontend',
                        (err, stream) => {
                            if (err) throw err;
                            stream.on('close', () => {
                                console.log('✅ Deployment complete!');
                                conn.end();
                            }).on('data', d => process.stdout.write(d))
                            .stderr.on('data', d => process.stderr.write(d));
                        }
                    );
                }
            });
        });
    });
}).connect({ host: '76.13.244.202', port: 22, username: 'root', password: 'Sir@@@admin123' });
