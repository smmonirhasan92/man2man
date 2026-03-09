const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
async function check() {
    await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });

    const pm2 = await ssh.execCommand('pm2 jlist');
    const procs = JSON.parse(pm2.stdout || '[]');
    procs.forEach(p => {
        console.log(`[${p.name}] status=${p.pm2_env.status} restarts=${p.pm2_env.restart_time} uptime=${Math.round(p.pm2_env.pm_uptime ? (Date.now() - p.pm2_env.pm_uptime) / 1000 : 0)}s`);
    });

    console.log('\n=== BACKEND LAST 50 LOG LINES ===');
    const logs = await ssh.execCommand('tail -n 50 ~/.pm2/logs/backend-error.log 2>/dev/null || pm2 logs backend --lines 50 --nostream 2>/dev/null | tail -50');
    console.log(logs.stdout || logs.stderr);

    console.log('\n=== LOGIN ENDPOINT SPEED TEST ===');
    const speed = await ssh.execCommand(`curl -s -o /dev/null -w "Status: %{http_code} | Total: %{time_total}s | Connect: %{time_connect}s" -X POST https://usaaffiliatemarketing.com/api/auth/login -H "Content-Type: application/json" -d '{"phone":"test","password":"test"}' 2>&1`);
    console.log(speed.stdout);

    ssh.dispose();
}
check().catch(console.error);
