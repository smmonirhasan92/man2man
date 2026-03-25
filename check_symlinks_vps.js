const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkSymlinks() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- Checking /var/www/usaaffiliatemarketing status ---');
        const res1 = await ssh.execCommand('ls -ld /var/www/usaaffiliatemarketing');
        console.log(res1.stdout);

        console.log('--- Checking /var/www/man2man status ---');
        const res2 = await ssh.execCommand('ls -ld /var/www/man2man');
        console.log(res2.stdout);

        console.log('--- Checking Nginx sites-enabled for usaaffiliate ---');
        const res3 = await ssh.execCommand('grep -r "/var/www" /etc/nginx/sites-enabled');
        console.log(res3.stdout);

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
checkSymlinks();
