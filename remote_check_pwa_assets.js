const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkPwaAssets() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });
        
        console.log('--- MANIFEST.JSON ---');
        const manifest = await ssh.execCommand('cat /var/www/man2man/frontend/public/manifest.json');
        console.log(manifest.stdout);
        
        console.log('\n--- CHECKING ICONS ---');
        const icons = await ssh.execCommand('ls -l /var/www/man2man/frontend/public/*.png');
        console.log(icons.stdout);

        ssh.dispose();
    } catch (err) {
        console.error('Check Failed:', err);
        ssh.dispose();
    }
}

checkPwaAssets();
