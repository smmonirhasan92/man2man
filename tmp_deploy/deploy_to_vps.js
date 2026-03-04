const { Client } = require('ssh2');

const conn = new Client();

console.log('Connecting to VPS (76.13.244.202)...');

conn.on('ready', () => {
    console.log('Authenticated automatically! Force-syncing repo and deploying...');

    const cmd = 'cd /var/www/man2man && git fetch --all && git reset --hard origin/main && npm install && cd frontend && npm run build && pm2 restart all';

    conn.exec(cmd, (err, stream) => {
        if (err) {
            console.error('Execution Error:', err);
            conn.end();
            return;
        }

        stream.on('close', (code, signal) => {
            console.log('\nDeployment stream closed. Exit Code: ' + code);
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data.toString('utf-8'));
        }).stderr.on('data', (data) => {
            process.stderr.write(data.toString('utf-8'));
        });
    });
}).on('error', (err) => {
    console.error('Connection Error:', err);
}).connect({
    host: '76.13.244.202',
    port: 22,
    username: 'root',
    password: 'Sir@@@admin123'
});
