const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function check() {
    await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });

    console.log('--- NGINX CONFIGS ---');
    const r = await ssh.execCommand('ls /etc/nginx/sites-enabled');
    console.log(r.stdout.trim());

    const sites = r.stdout.trim().split('\n');
    for (const site of sites) {
        if (site) {
            console.log(`\n--- CONFIG: ${site} ---`);
            const r2 = await ssh.execCommand(`cat /etc/nginx/sites-enabled/${site}`);
            console.log(r2.stdout.trim());
        }
    }

    ssh.dispose();
}

check().catch(console.error);
