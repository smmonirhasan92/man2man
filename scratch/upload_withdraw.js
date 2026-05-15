const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
    console.log('SSH Connected');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const content = fs.readFileSync('frontend/components/wallet/WithdrawForm.js');
        sftp.writeFile('/var/www/man2man/frontend/components/wallet/WithdrawForm.js', content, (err) => {
            if (err) throw err;
            console.log('✅ WithdrawForm.js uploaded');
            conn.exec(
                'cd /var/www/man2man && docker compose up -d --build frontend',
                (err, stream) => {
                    if (err) throw err;
                    stream.on('close', () => {
                        console.log('✅ Frontend rebuilt!');
                        conn.end();
                    }).on('data', d => process.stdout.write(d))
                    .stderr.on('data', d => process.stderr.write(d));
                }
            );
        });
    });
}).connect({ host: '76.13.244.202', port: 22, username: 'root', password: 'Sir@@@admin123' });
