const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
    console.log('SSH Connection Established');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        
        const referralContent = fs.readFileSync('backend/modules/referral/ReferralService.js');
        
        sftp.writeFile('/var/www/man2man/backend/modules/referral/ReferralService.js', referralContent, (err) => {
            if (err) throw err;
            console.log('ReferralService.js uploaded');
            
            conn.exec('cd /var/www/man2man && docker compose up -d --build backend', (err, stream) => {
                if (err) throw err;
                stream.on('close', () => {
                    console.log('Rebuild done');
                    conn.end();
                }).on('data', (data) => {
                    process.stdout.write(data);
                }).stderr.on('data', (data) => {
                    process.stderr.write(data);
                });
            });
        });
    });
})
.connect({
    host: '76.13.244.202',
    port: 22,
    username: 'root',
    password: 'Sir@@@admin123'
});
