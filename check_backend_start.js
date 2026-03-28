const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

ssh.connect({
    host: '76.13.244.202',
    username: 'root',
    password: 'Sir@@@admin123'
}).then(async () => {
    
    // Check if backend started, and if not why
    console.log('=== PM2 full list ===');
    const s = await ssh.execCommand('pm2 list --no-color');
    console.log(s.stdout);

    console.log('\n=== Backend error log (last 20 lines) ===');
    const l = await ssh.execCommand('tail -20 /root/.pm2/logs/man2man-backend-error.log 2>&1');
    console.log(l.stdout || l.stderr);

    // Check which port the backend runs on
    console.log('\n=== Port check (3000, 4000, 5000) ===');
    const p = await ssh.execCommand('ss -tlnp | grep -E "3000|4000|5000"');
    console.log(p.stdout || 'Nothing on those ports');

    // Try to start backend with logs visible
    console.log('\n=== Looking for index.js in backend ===');
    const f = await ssh.execCommand('find /var/www/man2man -name "index.js" -maxdepth 3');
    console.log(f.stdout);

    ssh.dispose();
}).catch(e => { console.error(e.message); process.exit(1); });
