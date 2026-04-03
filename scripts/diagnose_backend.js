const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

ssh.connect({
    host: '76.13.244.202',
    username: 'root',
    password: 'Sir@@@admin123'
}).then(async () => {
    
    // Check backend error logs first
    console.log('=== BACKEND ERROR LOG (last 50 lines) ===');
    const log = await ssh.execCommand('tail -50 /root/.pm2/logs/man2man-backend-error.log 2>&1');
    console.log(log.stdout || log.stderr || 'No log found');

    // Check what's in /var/www/man2man (root dir)
    console.log('\n=== Backend dir check ===');
    const ls = await ssh.execCommand('ls /var/www/man2man/backend/ 2>&1 | head -20');
    console.log(ls.stdout || 'No backend folder?');

    // Check for index.js in root or backend
    console.log('\n=== Looking for index.js ===');
    const find = await ssh.execCommand('find /var/www/man2man -maxdepth 2 -name "index.js" 2>&1');
    console.log(find.stdout);

    // Check .env file
    console.log('\n=== .env check ===');
    const env = await ssh.execCommand('ls /var/www/man2man/backend/.env 2>&1 || ls /var/www/man2man/.env 2>&1');
    console.log(env.stdout);

    ssh.dispose();
}).catch(e => { console.error(e.message); process.exit(1); });
