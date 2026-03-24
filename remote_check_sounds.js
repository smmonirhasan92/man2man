const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkSounds() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- CHECKING SOUND FILES ---');
        const results = await ssh.execCommand('ls -l frontend/public/sounds/', { cwd: '/var/www/man2man' });
        console.log(results.stdout || "Sounds directory or files missing.");
        
        console.log('\n--- CHECKING PWA ASSETS ---');
        const assets = await ssh.execCommand('ls -l frontend/public/networking_globe.png frontend/public/manifest.json', { cwd: '/var/www/man2man' });
        console.log(assets.stdout || assets.stderr);

        ssh.dispose();
    } catch (err) {
        console.error('Check Failed:', err);
        ssh.dispose();
    }
}

checkSounds();
