
const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
const localFile = process.argv[2];
const remotePath = process.argv[3];

if (!localFile || !remotePath) {
    console.log("Usage: node upload_file.js <local_file> <remote_path>");
    process.exit(1);
}

conn.on('ready', () => {
    console.log('--- SSH Connection Established ---');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        console.log(`Uploading ${localFile} to ${remotePath}...`);
        
        const readStream = fs.createReadStream(localFile);
        const writeStream = sftp.createWriteStream(remotePath);
        
        writeStream.on('close', () => {
            console.log('--- Upload Complete ---');
            conn.end();
        });
        
        writeStream.on('error', (err) => {
            console.error('Upload Error:', err);
            conn.end();
        });
        
        readStream.pipe(writeStream);
    });
}).on('error', (err) => {
    console.error('Connection Error: ' + err);
}).connect({
    host: '76.13.244.202',
    port: 22,
    username: 'root',
    password: 'Sir@@@admin123',
    readyTimeout: 100000
});
