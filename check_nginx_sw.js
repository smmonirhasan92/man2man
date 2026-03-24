const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkNginx() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- Nginx Config (man2man) ---');
        const res = await ssh.execCommand('cat /etc/nginx/sites-enabled/default || cat /etc/nginx/nginx.conf');
        console.log(res.stdout);

        console.log('--- Service Worker Files ---');
        const res2 = await ssh.execCommand('find /var/www/man2man/frontend/public -name "*sw*" || ls /var/www/man2man/frontend/public');
        console.log(res2.stdout);

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
checkNginx();
