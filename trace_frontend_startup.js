const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkNginxAndStart() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        console.log("--- Nginx Site Config (usaaffiliatemarketing.com) ---");
        // We look for common paths
        const nginx = await ssh.execCommand('cat /etc/nginx/sites-enabled/default || cat /etc/nginx/sites-enabled/usa-affiliate || cat /etc/nginx/conf.d/*.conf');
        console.log(nginx.stdout);

        console.log("--- Manual next start Trace ---");
        // We use absolute path to next bin if possible, or just npm start
        const start = await ssh.execCommand('npm start', { cwd: '/var/www/man2man/frontend' });
        console.log("STDOUT:", start.stdout);
        console.log("STDERR:", start.stderr);

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
checkNginxAndStart();
