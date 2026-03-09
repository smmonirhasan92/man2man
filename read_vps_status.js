const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function readEcosystem() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
        });

        console.log("--- Reading ecosystem.config.js ---");
        const content = await ssh.execCommand('cat /var/www/man2man/ecosystem.config.js');
        console.log(content.stdout);

        console.log("--- Listing PM2 again ---");
        const list = await ssh.execCommand('pm2 list');
        console.log(list.stdout);

    } catch (err) {
        console.error("SSH Error:", err);
    } finally {
        ssh.dispose();
    }
}

readEcosystem();
