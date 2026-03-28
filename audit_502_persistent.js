const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function deepAudit() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('--- 1. Port 3000 Occupancy ---');
        const portRes = await ssh.execCommand('netstat -tulpn | grep :3000');
        console.log(portRes.stdout || 'Port 3000 is FREE? (Wait, that means frontend is NOT running!)');

        console.log('\n--- 2. PM2 Status (List) ---');
        const pm2List = await ssh.execCommand('pm2 list');
        console.log(pm2List.stdout);

        console.log('\n--- 3. Frontend Error Logs (Last 50) ---');
        const logRes = await ssh.execCommand('pm2 logs frontend --lines 50 --nostream');
        console.log(logRes.stdout);

        console.log('\n--- 4. Memory Check ---');
        const memRes = await ssh.execCommand('free -m');
        console.log(memRes.stdout);

        console.log('\n--- 5. .next Directory Check (ls -la) ---');
        const nextRes = await ssh.execCommand('ls -la /var/www/man2man/frontend/.next');
        console.log(nextRes.stdout || 'MISSING .NEXT! (Build failed?)');

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
deepAudit();
