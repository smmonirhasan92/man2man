const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkVPS() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- Disk Space ---');
        const df = await ssh.execCommand('df -h');
        console.log(df.stdout);

        console.log('\n--- Memory ---');
        const free = await ssh.execCommand('free -m');
        console.log(free.stdout);

        console.log('\n--- Directory Check ---');
        const ls = await ssh.execCommand('ls -ld /var/www/man2man_build || echo "Not found"');
        console.log(ls.stdout);

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
checkVPS();
