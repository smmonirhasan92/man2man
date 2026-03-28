const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

ssh.connect({
    host: '76.13.244.202',
    username: 'root',
    password: 'Sir@@@admin123'
}).then(async () => {
    
    const backendDir = '/var/www/man2man/backend';

    // Delete old stuck process
    console.log('Deleting old backend processes...');
    await ssh.execCommand('pm2 delete man2man-backend || true');
    await ssh.execCommand('pm2 delete 2 || true');

    // Start with correct entry point: server.js
    console.log('Starting backend with server.js...');
    const start = await ssh.execCommand(`pm2 start ${backendDir}/server.js --name "man2man-backend" --cwd ${backendDir}`);
    console.log(start.stdout || start.stderr);

    // Wait 3 seconds
    await new Promise(r => setTimeout(r, 3000));

    // Check status
    const status = await ssh.execCommand('pm2 list --no-color');
    console.log('\nPM2 Status:\n' + status.stdout);

    // Check error log
    const errLog = await ssh.execCommand('tail -10 /root/.pm2/logs/man2man-backend-error.log 2>&1');
    console.log('\nBackend Error Log:\n' + (errLog.stdout || 'Clean!'));

    // Check what port backend is on
    const portCheck = await ssh.execCommand('ss -tlnp | grep -v 3000');
    console.log('\nPorts listening:\n' + portCheck.stdout);

    ssh.dispose();
    console.log('\nDone!');
}).catch(e => { console.error(e.message); process.exit(1); });
