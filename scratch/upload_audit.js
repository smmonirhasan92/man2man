const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        sftp.fastPut(
            'd:\\man2man_v2-VPS -- Meror\\scratch\\deep_audit.js',
            '/var/www/man2man/backend/deep_audit.js',
            (err) => {
                if (err) throw err;
                console.log('deep_audit.js uploaded');
                conn.end();
            }
        );
    });
}).connect({ host: '76.13.244.202', port: 22, username: 'root', password: 'Sir@@@admin123', readyTimeout: 100000 });
