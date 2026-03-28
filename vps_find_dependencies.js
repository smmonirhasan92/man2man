const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function findDependencies() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- SEARCHING FOR CHAT REFERENCES ---');
        // Simple grep to find any require or import of the chat module
        const cmd = 'grep -r "chat" /var/www/man2man/backend | grep "require"';
        const res = await ssh.execCommand(cmd);
        console.log(res.stdout);

        console.log('--- SEARCHING FOR SYMBOLIC LINKS ---');
        const res2 = await ssh.execCommand('find /var/www/man2man/backend -type l');
        console.log(res2.stdout);

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
findDependencies();
