const { NodeSSH } = require('node-ssh');
const fs = require('fs');

async function fetchNginx() {
    const ssh = new NodeSSH();
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        console.log('Connected. Fetching active Nginx configs...');

        const lsResult = await ssh.execCommand('ls -la /etc/nginx/sites-enabled/');
        console.log('Enabled Sites:', lsResult.stdout);

        let targetConf = 'default';
        if (lsResult.stdout.includes('usaaffiliatemarketing')) {
            targetConf = 'usaaffiliatemarketing.com';
        } else if (lsResult.stdout.includes('man2man')) {
            targetConf = 'man2man';
        }

        const confResult = await ssh.execCommand(`cat /etc/nginx/sites-enabled/*`);
        fs.writeFileSync('nginx_dump.txt', confResult.stdout);
        console.log('Done.');

    } catch (err) {
        console.error(err);
    } finally {
        ssh.dispose();
    }
}

fetchNginx();
