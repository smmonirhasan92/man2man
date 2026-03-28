const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function bindTest() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- BIND TEST PORT 5050 ---');
        // Simple script to test binding
        const testScript = `
const http = require('http');
const server = http.createServer((req, res) => {
    res.end('OK');
});
server.on('error', (err) => {
    process.stdout.write('BIND_ERROR: ' + err.code + '\\n');
    process.exit(1);
});
server.listen(5050, '0.0.0.0', () => {
    process.stdout.write('BIND_SUCCESS\\n');
    process.exit(0);
});
`;
        await ssh.execCommand(`echo "${testScript}" > /tmp/bind_test.js`);
        
        console.log('Stopping PM2 backend first...');
        await ssh.execCommand('pm2 stop man2man-backend');
        
        console.log('Running bind test...');
        const res = await ssh.execCommand('node /tmp/bind_test.js');
        console.log(res.stdout);
        
        console.log('Restarting PM2 backend...');
        await ssh.execCommand('pm2 start man2man-backend');

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
bindTest();
