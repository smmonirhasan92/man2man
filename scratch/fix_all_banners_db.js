const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
conn.on('ready', () => {
    console.log('--- SSH Connection Established ---');
    
    const dbCode = `
const mongoose = require('mongoose');
const Banner = require('./modules/banner/BannerModel');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/man2man_v2_new';

mongoose.connect(MONGO_URI)
.then(async () => {
    const banners = [
        { regex: /Invite Friends/i, bg: '/banner_2.png' },
        { regex: /Daily Income/i, bg: '/banner_1.png' },
        { regex: /Feeling Lucky/i, bg: '/banner_3.png' },
        { regex: /Mega Jackpot/i, bg: '/banner_4.png' }
    ];

    for (const b of banners) {
        const res = await Banner.findOneAndUpdate(
            { title: b.regex },
            { bgType: 'image', bgValue: b.bg },
            { new: true }
        );
        console.log("Updated", b.bg, ":", res ? "Found" : "Not Found");
    }
    process.exit();
})
.catch(err => { console.error(err); process.exit(1); });
`.replace(/"/g, '\\"').replace(/\n/g, ' ');

    conn.exec(`docker exec m2m-backend node -e "${dbCode}"`, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => { console.log('Done!'); conn.end(); })
        .on('data', d => process.stdout.write(d.toString()))
        .stderr.on('data', d => process.stderr.write(d.toString()));
    });
}).connect({ host: '76.13.244.202', port: 22, username: 'root', password: 'Sir@@@admin123', readyTimeout: 100000 });
