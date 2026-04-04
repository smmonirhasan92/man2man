const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
let output = '';

conn.on('ready', () => {
    conn.exec("cat /etc/nginx/sites-enabled/usaaffiliatemarketing.com", (err, stream) => {
        if (err) { console.error(err); conn.end(); return; }
        stream.on('close', () => {
            fs.writeFileSync('scripts/prod_nginx_config.txt', output, 'utf8');
            console.log('=== START ===');
            console.log(output);
            console.log('=== END ===');
            conn.end();
        }).on('data', (data) => {
            output += data.toString();
        }).stderr.on('data', (data) => {
            console.error(data.toString());
        });
    });
}).connect({
    host: '76.13.244.202',
    port: 22,
    username: 'root',
    password: 'Sir@@@admin123',
    readyTimeout: 10000
});
