const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkFiles() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('--- CHECKING KERNEL DIRECTORY ---');
        const r1 = await ssh.execCommand('ls -la /var/www/man2man/backend/kernel || echo "DIRECTORY DOES NOT EXIST"');
        console.log(r1.stdout);
        console.log(r1.stderr);

        ssh.dispose();
    } catch (err) {
        console.log(err);
    }
}
checkFiles();
