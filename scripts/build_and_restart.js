const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function buildAndRestart() {
    console.log('Connecting...');
    await ssh.connect({
        host: '76.13.244.202',
        username: 'root',
        password: 'Sir@@@admin123',
        keepaliveInterval: 30000,
        readyTimeout: 30000
    });
    
    const frontendDir = '/var/www/man2man/frontend';

    // Step 1: Stop everything
    console.log('\nStep 1: Stopping all processes...');
    await ssh.execCommand('pm2 stop all');
    await ssh.execCommand('fuser -k 3000/tcp || true');

    // Step 2: Clear incomplete .next
    console.log('Step 2: Clearing incomplete .next build...');
    await ssh.execCommand(`rm -rf ${frontendDir}/.next`);

    // Step 3: Build — this is the critical step, give it plenty of time
    console.log('Step 3: Running npm run build (2-4 mins expected)...');
    const buildResult = await ssh.execCommand(
        `cd ${frontendDir} && npm run build 2>&1`,
        { execOptions: { timeout: 600000 } }
    );
    const buildOut = (buildResult.stdout || '') + (buildResult.stderr || '');
    console.log('=== BUILD OUTPUT (last 3000 chars) ===');
    console.log(buildOut.slice(-3000));

    if (buildOut.includes('error') || buildOut.includes('Error')) {
        console.log('\n⚠️  Build may have errors. Checking .next anyway...');
    } else {
        console.log('\n✅ Build appears successful!');
    }

    // Step 4: Verify build exists
    const checkBuild = await ssh.execCommand(`ls ${frontendDir}/.next/BUILD_ID 2>&1`);
    console.log('\nBUILD_ID check:', checkBuild.stdout || 'MISSING! Build failed.');
    
    if (!checkBuild.stdout || checkBuild.stdout.includes('No such')) {
        console.log('❌ Build failed. Cannot start server.');
        ssh.dispose();
        return;
    }

    // Step 5: Start processes
    console.log('\nStep 5: Starting services...');
    await ssh.execCommand('pm2 delete frontend || true');
    await ssh.execCommand(`pm2 start npm --name "frontend" --cwd ${frontendDir} -- start`);
    await ssh.execCommand('pm2 restart man2man-backend || pm2 start index.js --name "man2man-backend" --cwd /var/www/man2man');
    await ssh.execCommand('pm2 save');

    // Step 6: Verify
    console.log('\nStep 6: Waiting 10s then verifying...');
    await new Promise(r => setTimeout(r, 10000));
    const httpCheck = await ssh.execCommand('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000');
    console.log('HTTP STATUS:', httpCheck.stdout);

    const pm2Status = await ssh.execCommand('pm2 list --no-color');
    console.log('\nPM2 STATUS:\n' + pm2Status.stdout);

    ssh.dispose();
    console.log('\n✅ DONE. Site should be LIVE now!');
}

buildAndRestart().catch(err => {
    console.error('Script error:', err.message);
    ssh.dispose();
    process.exit(1);
});
