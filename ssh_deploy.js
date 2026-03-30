const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    console.log('SSH connection to VPS established');
    const cmds = "export NODE_OPTIONS=\"--max-old-space-size=2048\" && cd /var/www/man2man && git pull origin main && npm install && pm2 restart backend && pm2 restart frontend || pm2 restart all";
    
    const fullCmd = "cd /var/www/man2man && git stash && git pull origin main && npm install && cd frontend && export NODE_OPTIONS='--max-old-space-size=2048' && rm -rf .next && npm run build && cd .. && pm2 restart all";

    conn.exec(fullCmd, { pty: true }, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('Deployment stream closed with code: ' + code);
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data);
        }).stderr.on('data', (data) => {
            process.stderr.write(data);
        });
    });
}).on('error', (err) => {
    console.error('Connection error: ' + err);
}).connect({
    host: '76.13.244.202',
    port: 22,
    username: 'root',
    password: 'Sir@@@admin123',
    readyTimeout: 100000
});
