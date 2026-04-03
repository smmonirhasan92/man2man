const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function deepVerify() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        const testScript = `
const http = require('http');
const data = JSON.stringify({ message: 'Hi' });
const options = {
    hostname: 'localhost',
    port: 5050,
    path: '/api/chat',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    },
    timeout: 30000
};
const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('STATUS: ' + res.statusCode);
        console.log('BODY: ' + body);
        process.exit(0);
    });
});
req.on('error', (e) => {
    console.log('ERROR: ' + e.message);
    process.exit(1);
});
req.write(data);
req.end();
`;
        await ssh.execCommand(`echo "${testScript.replace(/"/g, '\\"').replace(/\$/g, '\\$')}" > /var/www/man2man/backend/test_api_local.js`);

        console.log('Running native Node test on VPS...');
        const result = await ssh.execCommand('node test_api_local.js', { cwd: '/var/www/man2man/backend' });
        console.log('TEST RESULT:\n', result.stdout);
        console.log('TEST ERROR:\n', result.stderr);

    } catch (e) { console.error('Deep Verify Failed:', e); } finally { ssh.dispose(); }
}
deepVerify();
