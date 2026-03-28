const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

ssh.connect({
    host: '76.13.244.202',
    username: 'root',
    password: 'Sir@@@admin123'
}).then(async () => {
    
    const file = '/var/www/man2man/backend/controllers/adminController.js';
    
    // Fix: Remove the duplicate line (line 614 = second totalSelfDeposit declaration)
    // The duplicate is: const totalSelfDeposit = self_deposits[0]?.total || 0;
    // We keep first occurrence, remove second (which is immediately after totalAdminLoan)
    console.log('Applying fix: removing duplicate const declaration...');
    
    // Use sed to delete the duplicate line (the second const totalSelfDeposit)
    // Pattern: after "const totalAdminLoan", remove the line with "const totalSelfDeposit"
    const fixCmd = `sed -i '/const totalAdminLoan = admin_loans/{ n; /const totalSelfDeposit/d }' ${file}`;
    const fixResult = await ssh.execCommand(fixCmd);
    console.log('Fix applied:', fixResult.stdout || fixResult.stderr || '(no output = success)');

    // Verify the fix
    console.log('\n=== Verifying fix (lines around 610-618) ===');
    const verify = await ssh.execCommand(`grep -n "totalSelfDeposit" ${file} | head -5`);
    console.log(verify.stdout);

    // Now restart backend
    console.log('\nRestarting backend...');
    await ssh.execCommand('pm2 delete man2man-backend || true');
    const startResult = await ssh.execCommand('pm2 start /var/www/man2man/backend/index.js --name "man2man-backend" --cwd /var/www/man2man/backend');
    console.log(startResult.stdout);

    // Wait and check
    await new Promise(r => setTimeout(r, 3000));
    const status = await ssh.execCommand('pm2 list --no-color | grep backend');
    console.log('\nBackend status:', status.stdout);

    const apiCheck = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/auth/me');
    console.log('API health check:', apiCheck.stdout);

    ssh.dispose();
    console.log('\nDone!');
}).catch(e => { console.error(e.message); process.exit(1); });
