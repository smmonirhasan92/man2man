const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkDBRemote() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('Uploading script...');
        await ssh.putFile('d:\\man2man\\remote_check_db.js', '/var/www/man2man/backend/remote_check_db.js');

        console.log('Executing script...');
        const r2 = await ssh.execCommand('node remote_check_db.js', { cwd: '/var/www/man2man/backend' });
        console.log(r2.stdout);
        console.log(r2.stderr);

        ssh.dispose();
    } catch (err) {
        console.log(err);
    }
}
checkDBRemote();
