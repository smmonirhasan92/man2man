const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkConfig() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
        });

        console.log("--- ecosystem.config.js ---");
        const cat = await ssh.execCommand('cat /var/www/man2man/ecosystem.config.js');
        console.log(cat.stdout);

        console.log("--- Manual Start Trace ---");
        // We run node server.js directly and capture the output
        const start = await ssh.execCommand('node server.js', { cwd: '/var/www/man2man/backend' });
        console.log("STDOUT:", start.stdout);
        console.log("STDERR:", start.stderr);

    } catch (err) {
        console.error("SSH Error:", err);
    } finally {
        ssh.dispose();
    }
}

checkConfig();
