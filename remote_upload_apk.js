const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const path = require('path');

async function uploadAPK() {
    try {
        console.log('Connecting to Hostinger VPS...');
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        const localPath = 'd:/man2man/app/base (1).apk';
        const remotePath = '/var/www/man2man/frontend/public/app.apk';
        
        console.log(`Uploading ${localPath} to ${remotePath}...`);
        await ssh.putFile(localPath, remotePath);
        
        console.log('✅ APK Uploaded Successfully.');
        
        // Also ensure PWA icons are linked if they are missing
        console.log('Checking for icons...');
        const iconCheck = await ssh.execCommand('ls -l networking_globe.png', { cwd: '/var/www/man2man/frontend/public' });
        if (iconCheck.stderr) {
            console.log('Icon missing. Copying networking_globe.png to app-icon.png if needed...');
            await ssh.execCommand('cp networking_globe.png app-icon.png', { cwd: '/var/www/man2man/frontend/public' }).catch(() => {});
        }

        ssh.dispose();
    } catch (err) {
        console.error('Upload Failed:', err);
        ssh.dispose();
    }
}

uploadAPK();
