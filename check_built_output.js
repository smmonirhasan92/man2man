const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkBuiltOutput() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- Searching for "USD Amount" in .next directory ---');
        const res = await ssh.execCommand('grep -r "USD Amount" /var/www/man2man/frontend/.next');
        console.log(res.stdout || 'NOT FOUND IN BUILT OUTPUT!');
        
        console.log('--- Searching for "NXS Amount" in .next directory ---');
        const res2 = await ssh.execCommand('grep -r "NXS Amount" /var/www/man2man/frontend/.next');
        console.log(res2.stdout || 'NOT FOUND (Good)');

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
checkBuiltOutput();
