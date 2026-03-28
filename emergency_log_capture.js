const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function getLogs() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('--- 1. PM2 Status List ---');
        const listRes = await ssh.execCommand('pm2 jlist');
        const apps = JSON.parse(listRes.stdout);
        apps.forEach(app => {
            console.log(`App: ${app.name}, Status: ${app.pm2_env.status}, CWD: ${app.pm2_env.pm_cwd}, Port: ${app.pm2_env.PORT || '3000?'}`);
        });

        console.log('\n--- 2. PM2 Logs (Combined) ---');
        const logRes1 = await ssh.execCommand('pm2 logs frontend --lines 100 --nostream');
        console.log(logRes1.stdout);

        console.log('\n--- 3. Port Occupancy (LSOF) ---');
        const portRes = await ssh.execCommand('lsof -i :3000');
        console.log(portRes.stdout || 'Port 3000 is UNUSED!');

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
getLogs();
