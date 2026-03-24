const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const path = require('path');

async function syncIcons() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });
        
        const localDir = 'd:/man2man/frontend/public';
        const remoteDir = '/var/www/man2man/frontend/public';
        
        const icons = ['app-icon.png', 'networking_globe.png', 'logo.png'];
        
        for (const icon of icons) {
            const localPath = path.join(localDir, icon);
            const remotePath = path.join(remoteDir, icon).replace(/\\/g, '/');
            console.log(`Uploading ${icon}...`);
            await ssh.putFile(localPath, remotePath);
            console.log(`✅ ${icon} uploaded.`);
        }

        ssh.dispose();
    } catch (err) {
        console.error('Upload Failed:', err);
        ssh.dispose();
    }
}

syncIcons();
