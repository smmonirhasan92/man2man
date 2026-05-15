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
                local: 'C:/Users/user/.gemini/antigravity/brain/cd3ddd3f-6bf4-4cb8-94d6-10da08bb86c7/banner_lottery_jackpot_1778750564759.png', 
                remote: '/var/www/man2man/frontend/public/banner_4.png' 
            }
        ];

        let completed = 0;
        files.forEach(f => {
            sftp.fastPut(f.local, f.remote, (err) => {
                if (err) { console.error(`Upload failed for ${f.local}:`, err); conn.end(); return; }
                console.log(`✅ Uploaded: ${path.basename(f.remote)}`);
                completed++;
                if (completed === files.length) {
                    console.log('--- File uploaded. Running DB Update ---');
                    
                    const dbScript = `
const mongoose = require('mongoose');
const Banner = require('./modules/banner/BannerModel');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://mongodb:27017/man2man_v2_new')
.then(async () => {
    await Banner.findOneAndUpdate(
        { title: /Mega Jackpot/i },
        { 
            bgType: 'image', 
            bgValue: '/banner_4.png',
            btnColor: '#8B5CF6'
        }
    );
    console.log("DB Updated: 4th Banner now has an image!");
    process.exit();
})
.catch(err => { console.error(err); process.exit(1); });
`;
                    const remoteScriptPath = '/var/www/man2man/backend/scripts/fix_4th_banner.js';
                    sftp.writeFile(remoteScriptPath, dbScript, (err) => {
                        if (err) throw err;
                        console.log('✅ DB fix script written.');
                        
                        conn.exec('docker exec m2m-backend node scripts/fix_4th_banner.js && cd /var/www/man2man && docker compose -f docker-compose.prod.yml up -d --build frontend', (err, stream) => {
                            if (err) throw err;
                            stream.on('close', () => { console.log('Done!'); conn.end(); })
                            .on('data', d => process.stdout.write(d.toString()))
                            .stderr.on('data', d => process.stderr.write(d.toString()));
                        });
                    });
                }
            });
        });
    });
}).connect({ host: '76.13.244.202', port: 22, username: 'root', password: 'Sir@@@admin123', readyTimeout: 100000 });
