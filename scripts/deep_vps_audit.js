const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

ssh.connect({
    host: '76.13.244.202',
    username: 'root',
    password: 'Sir@@@admin123'
}).then(async () => {
    
    // Step 1: Check what folders exist in /var/www
    const r1 = await ssh.execCommand('ls -la /var/www/');
    console.log('=== /var/www/ FOLDERS ===\n' + r1.stdout);

    // Step 2: Check man2man folder
    const r2 = await ssh.execCommand('ls /var/www/man2man/ 2>&1');
    console.log('\n=== man2man/ CONTENTS ===\n' + r2.stdout);

    // Step 3: Check if .next build exists
    const r3 = await ssh.execCommand('ls /var/www/man2man/frontend/.next/ 2>&1 | head -3');
    console.log('\n=== .next BUILD ===\n' + (r3.stdout || 'MISSING!'));

    // Step 4: PM2 status
    const r4 = await ssh.execCommand('pm2 list --no-color');
    console.log('\n=== PM2 LIST ===\n' + r4.stdout);

    // Step 5: Last error logs
    const r5 = await ssh.execCommand('tail -20 /root/.pm2/logs/frontend-error.log 2>&1');
    console.log('\n=== FRONTEND ERROR LOG ===\n' + (r5.stdout || r5.stderr));

    ssh.dispose();
}).catch(err => {
    console.error('ERROR:', err.message);
    process.exit(1);
});
