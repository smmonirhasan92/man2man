const fs = require('fs');
const { NodeSSH } = require('node-ssh');
const path = require('path');

const ssh = new NodeSSH();

async function uploadFiles() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123'
        });

        const files = [
            'frontend/components/PWAInstallPrompt.js',
            'frontend/app/login/page.js',
            'frontend/app/register/page.js'
        ];

        for (const file of files) {
            const localPath = path.join('d:/man2man', file);
            const remotePath = path.join('/var/www/man2man', file).replace(/\\/g, '/');

            console.log(`Uploading ${localPath} -> ${remotePath}`);
            await ssh.putFile(localPath, remotePath);
        }

        console.log('Restarting PM2 (deploy.sh handles rebuild)...');
        await ssh.execCommand('cd /var/www/man2man && ./deploy.sh');

        console.log('Done.');
        ssh.dispose();
    } catch (err) {
        console.error('Upload failed:', err);
        ssh.dispose();
    }
}

uploadFiles();
