const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        sftp.fastPut(
            'd:\\man2man_v2-VPS -- Meror\\scratch\\convert_agents_to_users.js',
            '/var/www/man2man/backend/convert_agents_to_users.js',
            (err) => {
                if (err) throw err;
                console.log('convert_agents_to_users.js uploaded');
                conn.end();
            }
        );
    });
}).connect({ host: '76.13.244.202', port: 22, username: 'root', password: 'Sir@@@admin123', readyTimeout: 100000 });
