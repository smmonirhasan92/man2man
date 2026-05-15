const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
conn.on('ready', () => {
    console.log('--- SSH Connection Established ---');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        // 1. Files to upload
        const files = [
            { 
                local: 'C:/Users/user/.gemini/antigravity/brain/cd3ddd3f-6bf4-4cb8-94d6-10da08bb86c7/banner_earning_growth_1778749911667.png', 
                remote: '/var/www/man2man/frontend/public/banner_1.png' 
            },
            { 
                local: 'C:/Users/user/.gemini/antigravity/brain/cd3ddd3f-6bf4-4cb8-94d6-10da08bb86c7/banner_team_collaboration_1778749927158.png', 
                remote: '/var/www/man2man/frontend/public/banner_2.png' 
            },
            { 
                local: 'C:/Users/user/.gemini/antigravity/brain/cd3ddd3f-6bf4-4cb8-94d6-10da08bb86c7/banner_secure_platform_1778750053765.png', 
                remote: '/var/www/man2man/frontend/public/banner_3.png' 
            },
            { 
                local: path.join(__dirname, '..', 'frontend/components/ImageSlider.js'), 
                remote: '/var/www/man2man/frontend/components/ImageSlider.js' 
            }
        ];

        let completed = 0;
        files.forEach(f => {
            sftp.fastPut(f.local, f.remote, (err) => {
                if (err) { console.error(`Upload failed for ${f.local}:`, err); conn.end(); return; }
                console.log(`✅ Uploaded: ${path.basename(f.remote)}`);
                completed++;
                if (completed === files.length) {
                    console.log('--- All files uploaded. Starting Docker Rebuild ---');
                    conn.exec('cd /var/www/man2man && docker compose -f docker-compose.prod.yml up -d --build frontend', (err, stream) => {
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
