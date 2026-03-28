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
        
        console.log('--- NGINX CONFIG ---');
        const res1 = await ssh.execCommand('cat /etc/nginx/sites-enabled/usaaffiliatemarketing.com');
        console.log(res1.stdout);

        console.log('--- BACKEND server.js (Shield Check) ---');
        const res2 = await ssh.execCommand('sed -n "30,150p" backend/server.js', { cwd: '/var/www/man2man' });
        console.log(res2.stdout);
        
        console.log('--- BACKEND .env ---');
        const res3 = await ssh.execCommand('cat backend/.env', { cwd: '/var/www/man2man' });
        console.log(res3.stdout);

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
audit();
