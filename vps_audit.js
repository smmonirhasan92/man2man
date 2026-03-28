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
        
        console.log('--- Phase 1: Nginx Proxy Settings ---');
        const res1 = await ssh.execCommand('grep -r "proxy_pass" /etc/nginx/sites-enabled/');
        console.log(res1.stdout);

        console.log('--- Phase 2: Frontend Environment ---');
        const res2 = await ssh.execCommand('find frontend -name ".env*"', { cwd: '/var/www/man2man' });
        console.log(res2.stdout);
        
        const envFiles = res2.stdout.trim().split('\n');
        for (const file of envFiles) {
            if (file) {
                console.log(`--- Content of ${file} ---`);
                const res = await ssh.execCommand(`cat ${file}`, { cwd: '/var/www/man2man' });
                console.log(res.stdout);
            }
        }

        console.log('--- Phase 3: Frontend Configs ---');
        const res3 = await ssh.execCommand('cat frontend/next.config.js', { cwd: '/var/www/man2man' });
        console.log(res3.stdout);

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
audit();
