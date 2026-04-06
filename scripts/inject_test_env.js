const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const localFile = 'backend/.env.test.vps';
const remoteFile = '/var/www/man2man/backend/.env.test';

conn.on('ready', () => {
    console.log('--- SFTP Connected for Secret Injection ---');
    conn.exec(`mkdir -p /var/www/man2man/backend`, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            conn.sftp((err, sftp) => {
                if (err) throw err;
                const data = fs.readFileSync(localFile);
                sftp.writeFile(remoteFile, data, (err) => {
                    if (err) {
                        console.error('Upload Error:', err);
                    } else {
                        console.log('✅ SECRET INJECTED SUCCESSFULLY.');
                    }
                    conn.end();
                });
            });
        });
    });
}).on('error', (err) => {
    console.error('Connection Error: ' + err);
}).connect({
    host: '76.13.244.202',
    port: 22,
    username: 'root',
    password: 'Sir@@@admin123',
    readyTimeout: 99999
});
