const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

(async () => {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });
        
        await ssh.execCommand('pm2 flush');
        
        console.log('--- Triggering POST ---');
        const curlCmd = `curl -s -X POST http://127.0.0.1:5050/api/auth/register -H "Content-Type: application/json" -d '{"identityName":"CrashTest123","phone":"01788877766","password":"pass123"}'`;
        
        const curlRes = await ssh.execCommand(curlCmd);
        console.log('CURL RESPONSE:\\n', curlRes.stdout);
        console.log('CURL ERRS:\\n', curlRes.stderr);
        
        await new Promise(r => setTimeout(r, 2000));
        
        console.log('--- Fetching PM2 Logs ---');
        const logsErr = await ssh.execCommand('tail -n 100 /root/.pm2/logs/man2man-backend-error.log');
        require('fs').writeFileSync('trace.txt', 'CURL:\\n' + curlRes.stdout + '\\nERR:\\n' + curlRes.stderr + '\\nLOGS:\\n' + logsErr.stdout);
        console.log('Logs written to trace.txt');
        
        ssh.dispose();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
