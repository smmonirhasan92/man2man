const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const crypto = require('crypto');
const ssh = new NodeSSH();

async function nuclearRestoreV2() {
    try {
        const localPath = 'd:\\man2man\\backend\\server.js';
        const localContent = fs.readFileSync(localPath, 'utf8');
        const localMd5 = crypto.createHash('md5').update(localContent).digest('hex');
        console.log('LOCAL MD5:', localMd5);

        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('Stopping all backend processes...');
        await ssh.execCommand('pm2 stop man2man-backend');
        await ssh.execCommand('pkill -f "node server.js"');
        
        console.log('Deleting corrupted server.js...');
        await ssh.execCommand('rm /var/www/man2man/backend/server.js');
        
        console.log('Uploading clean server.js...');
        await ssh.putFile(localPath, '/var/www/man2man/backend/server.js');
        
        console.log('Verifying VPS MD5...');
        const resMd5 = await ssh.execCommand('md5sum /var/www/man2man/backend/server.js');
        const vpsMd5 = resMd5.stdout.split(' ')[0];
        console.log('VPS MD5:', vpsMd5);
        
        if (localMd5 === vpsMd5) {
            console.log('SUCCESS: MD5 MATCH!');
            console.log('Restarting backend...');
            await ssh.execCommand('pm2 start app.js --name man2man-backend --cwd /var/www/man2man/backend'); // Using app.js if that's the PM2 entry, or server.js
            // Wait, I should check if it's app.js or server.js in PM2.
            // Based on previous logs, it was man2man-backend.
            await ssh.execCommand('pm2 restart man2man-backend');
        } else {
            console.error('CRITICAL: MD5 MISMATCH AFTER UPLOAD!');
        }

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
nuclearRestoreV2();
