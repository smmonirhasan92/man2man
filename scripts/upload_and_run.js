const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const scriptContent = fs.readFileSync(process.argv[2], 'utf8');

conn.on('ready', () => {
    console.log('--- SSH Connection Established ---');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const writeStream = sftp.createWriteStream('/root/setup_mail.sh');
        writeStream.on('close', () => {
            console.log('--- File Uploaded ---');
            conn.exec('bash /root/setup_mail.sh', (err, stream) => {
                if (err) throw err;
                stream.on('close', (code, signal) => {
                    console.log('--- Command Finished with code: ' + code + ' ---');
                    conn.end();
                }).on('data', (data) => {
                    process.stdout.write(data);
                }).stderr.on('data', (data) => {
                    process.stderr.write(data);
                });
            });
        });
        writeStream.write(scriptContent);
        writeStream.end();
    });
}).connect({
    host: '76.13.244.202',
    port: 22,
    username: 'root',
    password: 'Sir@@@admin123'
});
