const { Client } = require('ssh2');

const conn = new Client();
const cmds = [
    'echo "=== DISK USAGE ===" && df -h',
    'echo "\\n=== DOCKER SYSTEM USAGE ===" && docker system df',
    'echo "\\n=== LARGE DIRECTORIES IN /var/www/man2man ===" && du -sh /var/www/man2man/* | sort -rh | head -n 10',
    'echo "\\n=== DOCKER DANGLING VOLUMES ===" && docker volume ls -qf dangling=true | wc -l',
    'echo "\\n=== SYSTEM LOG SIZE ===" && journalctl --disk-usage',
    'echo "\\n=== PM2 LOGS (IF ANY) ===" && ls -lh ~/.pm2/logs 2>/dev/null || echo "No PM2 logs found"',
    'echo "\\n=== LARGE FILES > 100MB ===" && find /var/www/man2man -type f -size +100M -exec ls -lh {} \\;'
];

conn.on('ready', () => {
    console.log('--- SSH Connection Established ---');
    conn.exec(cmds.join(' ; '), (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('--- Analysis Complete ---');
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
