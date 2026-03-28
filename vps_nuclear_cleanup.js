const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function nuclearCleanup() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- NUCLEAR CLEANUP START ---');
        const folders = ['utils', 'modules', 'routes', 'controllers', 'kernel', 'config'];
        const base = '/var/www/man2man/backend/';
        
        for (const f of folders) {
            const path = base + f;
            console.log(`Deleting: ${path}`);
            await ssh.execCommand(`rm -rf ${path}`);
        }

        console.log('Verifying cleanup...');
        const res = await ssh.execCommand(`ls -a ${base}`);
        console.log('Remaining files in backend root:');
        console.log(res.stdout);

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
nuclearCleanup();
