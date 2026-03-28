const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function mongoCheck() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- MONGO STATUS ---');
        const res1 = await ssh.execCommand('systemctl status mongodb');
        console.log(res1.stdout);
        
        console.log('--- MONGO PING ---');
        const res2 = await ssh.execCommand("mongosh --eval \"db.adminCommand('ping')\"");
        console.log(res2.stdout);

        console.log('--- BACKEND LOGS (50 lines) ---');
        const res3 = await ssh.execCommand('pm2 logs man2man-backend --lines 50 --no-daemon');
        console.log(res3.stdout);

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
mongoCheck();
