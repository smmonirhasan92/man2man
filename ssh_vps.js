const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('SSH connection established');
    const cmds = "grep -q 'replSetName' /etc/mongod.conf || (echo -e '\\nreplication:\\n  replSetName: \"rs0\"' >> /etc/mongod.conf && systemctl restart mongod && sleep 5 && mongosh --quiet --eval 'rs.initiate()')";
    conn.exec(cmds, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('Command finished with code: ' + code);
            conn.end();
        }).on('data', (data) => {
            console.log('STDOUT: ' + data);
        }).stderr.on('data', (data) => {
            console.error('STDERR: ' + data);
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
