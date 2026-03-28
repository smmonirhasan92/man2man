const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function nginxCheck() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- NGINX SITES ---');
        const res1 = await ssh.execCommand('ls /etc/nginx/sites-enabled');
        console.log(res1.stdout);
        
        const sites = res1.stdout.split('\n').filter(Boolean);
        for (const site of sites) {
            console.log(`--- CONFIG: ${site} ---`);
            const res2 = await ssh.execCommand(`cat /etc/nginx/sites-enabled/${site}`);
            console.log(res2.stdout);
        }

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
nginxCheck();
