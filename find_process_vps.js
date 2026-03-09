const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function findProcess() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
        });

        console.log("--- Process on port 5050 ---");
        const lsof = await ssh.execCommand('lsof -i :5050');
        console.log(lsof.stdout || "No process found with lsof");

        console.log("--- Netstat -nlp ---");
        const netstat = await ssh.execCommand('netstat -nlp | grep 5050');
        console.log(netstat.stdout);

        console.log("--- PM2 Status ---");
        const pm2 = await ssh.execCommand('pm2 status');
        console.log(pm2.stdout);

        console.log("--- Ecosystem Content ---");
        const cat = await ssh.execCommand('cat /var/www/man2man/ecosystem.config.js');
        console.log(cat.stdout);

    } catch (err) {
        console.error("SSH Error:", err);
    } finally {
        ssh.dispose();
    }
}

findProcess();
