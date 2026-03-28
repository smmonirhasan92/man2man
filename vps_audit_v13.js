const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function audit() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- .ENV SIZE ---');
        const res1 = await ssh.execCommand('wc -c backend/.env', { cwd: '/var/www/man2man' });
        console.log(res1.stdout);

        console.log('--- .ENV CONTENT ---');
        const res2 = await ssh.execCommand('cat backend/.env', { cwd: '/var/www/man2man' });
        console.log(res2.stdout);

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
audit();
