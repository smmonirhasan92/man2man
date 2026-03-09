const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkPm2() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
        });

        console.log("--- Listing all PM2 processes ---");
        const list = await ssh.execCommand('pm2 list');
        console.log(list.stdout);

        console.log("--- Checking for ecosystem files ---");
        const files = await ssh.execCommand('ls /var/www/man2man/*.config.js');
        console.log(files.stdout);

    } catch (err) {
        console.error("SSH Error:", err);
    } finally {
        ssh.dispose();
    }
}

checkPm2();
