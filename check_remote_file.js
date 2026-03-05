const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkRemoteFile() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('--- REMOTE FILE CONTENT ---');
        const r1 = await ssh.execCommand('tail -n 30 /var/www/man2man/backend/controllers/settingsController.js');
        console.log(r1.stdout);
        console.log("STDERR:", r1.stderr);

        console.log('--- GIT STATUS ---');
        const r2 = await ssh.execCommand('git status', { cwd: '/var/www/man2man' });
        console.log(r2.stdout);
        console.log("STDERR:", r2.stderr);

        ssh.dispose();
    } catch (err) {
        console.log(err);
    }
}
checkRemoteFile();
