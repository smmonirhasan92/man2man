const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
conn.on('ready', () => {
    console.log('--- SSH Connection Established ---');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        const localImg = 'C:/Users/user/.gemini/antigravity/brain/cd3ddd3f-6bf4-4cb8-94d6-10da08bb86c7/banner_lottery_jackpot_1778750564759.png';
        const remoteImg = '/var/www/man2man/frontend/public/banner_4.png';

        sftp.fastPut(localImg, remoteImg, (err) => {
            if (err) { console.error(`Upload failed:`, err); conn.end(); return; }
            console.log(`✅ Uploaded: banner_4.png`);
            
            const dbCode = `
const mongoose = require('mongoose');
const Banner = require('./modules/banner/BannerModel');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/man2man_v2_new';

mongoose.connect(MONGO_URI)
.then(async () => {
    const res = await Banner.findOneAndUpdate(
        { title: /Mega Jackpot/i },
        { 
            bgType: 'image', 
            bgValue: '/banner_4.png',
            btnColor: '#8B5CF6'
        },
        { new: true }
    );
    console.log("DB Updated result:", res ? "Success" : "Not Found");
    process.exit();
})
.catch(err => { console.error(err); process.exit(1); });
`.replace(/"/g, '\\"').replace(/\n/g, ' ');

            console.log('--- Executing DB Update inside container ---');
            conn.exec(`docker exec m2m-backend node -e "${dbCode}"`, (err, stream) => {
                if (err) throw err;
                stream.on('close', () => { 
                    console.log('--- DB Update Done. Rebuilding Frontend ---');
                    conn.exec('cd /var/www/man2man && docker compose -f docker-compose.prod.yml up -d --build frontend', (err, s2) => {
                        if (err) throw err;
                        s2.on('close', () => { console.log('All Done!'); conn.end(); })
                        .on('data', d => process.stdout.write(d.toString()))
                        .stderr.on('data', d => process.stderr.write(d.toString()));
                    });
                })
                .on('data', d => process.stdout.write(d.toString()))
                .stderr.on('data', d => process.stderr.write(d.toString()));
            });
        });
    });
}).connect({ host: '76.13.244.202', port: 22, username: 'root', password: 'Sir@@@admin123', readyTimeout: 100000 });
