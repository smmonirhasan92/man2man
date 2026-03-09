const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function diagnose() {
    await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });
    console.log('✅ Connected\n');

    // 1. PM2 process status
    console.log('=== PM2 PROCESS STATUS ===');
    const pm2 = await ssh.execCommand('pm2 list');
    console.log(pm2.stdout);

    // 2. Recent backend errors
    console.log('\n=== BACKEND ERRORS (last 30 lines) ===');
    const errs = await ssh.execCommand('pm2 logs backend --lines 30 --nostream 2>&1 || pm2 logs 0 --lines 30 --nostream 2>&1');
    console.log(errs.stdout.slice(-3000));

    // 3. Nginx status
    console.log('\n=== NGINX STATUS ===');
    const nginx = await ssh.execCommand('systemctl is-active nginx');
    console.log(nginx.stdout);

    // 4. Quick API ping to measure speed
    console.log('\n=== API PING TEST ===');
    const ping = await ssh.execCommand('time curl -s -o /dev/null -w "%{http_code} | time_total=%{time_total}s" https://usaaffiliatemarketing.com/api 2>&1');
    console.log(ping.stdout);

    // 5. Check MongoDB connection
    console.log('\n=== MONGODB STATUS ===');
    const mongo = await ssh.execCommand('systemctl is-active mongod');
    console.log(mongo.stdout);

    ssh.dispose();
}

diagnose().catch(console.error);
