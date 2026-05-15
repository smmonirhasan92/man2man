const { Client } = require('ssh2');

const conn = new Client();
const cmds = [
    'echo "=== CLEANING OLD PM2 LOGS ==="',
    'rm -rf ~/.pm2/logs/*',
    'echo "\\n=== PRUNING DOCKER BUILD CACHE ==="',
    'docker builder prune -f --all',
    'echo "\\n=== PRUNING UNUSED DOCKER IMAGES & VOLUMES ==="',
    'docker system prune -f --volumes',
    'echo "\\n=== RE-CHECKING DISK USAGE ==="',
    'df -h /'
];

conn.on('ready', () => {
    console.log('--- SSH Connection Established ---');
    conn.exec(cmds.join(' ; '), (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('--- Optimization Complete ---');
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
