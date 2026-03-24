const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const path = require('path');

async function uploadSounds() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- UPLOADING SOUND FILES ---');
        
        const sounds = ['notification.mp3', 'success.mp3', 'error.mp3', 'click.mp3'];
        const localDir = path.join('d:', 'man2man', 'frontend', 'public', 'sounds');
        const remoteDir = '/var/www/man2man/frontend/public/sounds';
        
        for (const sound of sounds) {
            const localPath = path.join(localDir, sound);
            const remotePath = path.join(remoteDir, sound).replace(/\\/g, '/');
            
            console.log(`Uploading ${sound}...`);
            await ssh.putFile(localPath, remotePath);
            console.log(`✅ ${sound} uploaded.`);
        }

        ssh.dispose();
    } catch (err) {
        console.error('Upload Failed:', err);
        ssh.dispose();
    }
}

uploadSounds();
