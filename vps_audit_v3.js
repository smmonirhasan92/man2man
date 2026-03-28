const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function audit() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- PM2 JLIST ---');
        const res1 = await ssh.execCommand('pm2 jlist');
        const data = JSON.parse(res1.stdout);
        data.forEach(p => {
            console.log(`ID: ${p.pm_id}, Name: ${p.name}, Status: ${p.pm2_env.status}, Restarts: ${p.pm2_env.restart_time}`);
        });

        console.log('--- BACKEND ERROR LOG (Last 100 lines) ---');
        const res2 = await ssh.execCommand('tail -n 100 /root/.pm2/logs/man2man-backend-error.log');
        console.log(res2.stdout);

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
audit();
