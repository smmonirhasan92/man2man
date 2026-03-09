const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkDetails() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
        });

        console.log("--- PM2 logs man2man-backend ---");
        const logs = await ssh.execCommand('pm2 logs man2man-backend --lines 50 --nostream --no-colors');
        console.log(logs.stdout);
        console.log(logs.stderr);

        console.log("--- Netstat with PID ---");
        const net = await ssh.execCommand('netstat -nlp | grep 5050');
        console.log(net.stdout);

    } catch (err) {
        console.error("SSH Error:", err);
    } finally {
        ssh.dispose();
    }
}

checkDetails();
