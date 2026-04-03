const { Client } = require('ssh2');

const conn = new Client();
const cmd = process.argv[2] || 'ls -la';

if (!process.argv[2]) {
    console.log("Usage: node ssh_runner.js \"your command here\"");
    process.exit(1);
}

conn.on('ready', () => {
    console.log('--- SSH Connection Established ---');
    console.log('Executing: ' + cmd);
    
    conn.exec(cmd, (err, stream) => {
        if (err) {
            console.error('Execution Error: ' + err);
            conn.end();
            return;
        }
        
        stream.on('close', (code, signal) => {
            console.log('--- Command Finished with code: ' + code + ' ---');
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data);
        }).stderr.on('data', (data) => {
            process.stderr.write(data);
        });
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
