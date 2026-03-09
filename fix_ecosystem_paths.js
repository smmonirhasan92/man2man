const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function fixEcosystem() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
        });

        console.log("--- Current ecosystem.config.js ---");
        const cat = await ssh.execCommand('cat /var/www/man2man/ecosystem.config.js');
        console.log(cat.stdout);

        console.log("--- Checking directories ---");
        const ls = await ssh.execCommand('ls -l /var/www/man2man');
        console.log(ls.stdout);
        const lsFront = await ssh.execCommand('ls -l /var/www/man2man/frontend');
        console.log(lsFront.stdout);

    } catch (err) {
        console.error("SSH Error:", err);
    } finally {
        ssh.dispose();
    }
}

fixEcosystem();
