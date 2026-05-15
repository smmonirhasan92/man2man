const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('--- SSH Connection Established ---');
    const query = `db.transactions.find({ type: { $in: ['withdraw', 'cash_out'] } }).sort({ amount: -1 }).limit(3).toArray()`;
    const cmd = `mongosh -u root -p admin123 --authenticationDatabase admin man2man --eval "${query}"`;
    
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            conn.end();
        }).on('data', (data) => {
            console.log('STDOUT: ' + data);
        }).stderr.on('data', (data) => {
            console.error('STDERR: ' + data);
        });
    });
}).connect({
    host: '76.13.244.202',
    port: 22,
    username: 'root',
    password: 'Sir@@@admin123',
    readyTimeout: 100000
});
