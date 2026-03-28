const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const crypto = require('crypto');
const ssh = new NodeSSH();

async function robustRestore() {
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
        
        console.log('Stopping PM2...');
        await ssh.execCommand('pm2 stop man2man-backend');
        
        console.log('Uploading server.js via cat...');
        // Escape backticks and dollar signs for the shell
        const escapedContent = localContent.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
        await ssh.execCommand(`cat << 'EOF' > /var/www/man2man/backend/server.js\n${localContent}\nEOF`);
        
        console.log('Verifying VPS MD5...');
        const resMd5 = await ssh.execCommand('md5sum /var/www/man2man/backend/server.js');
        const vpsMd5 = resMd5.stdout.split(' ')[0];
        console.log('VPS MD5:', vpsMd5);
        
        if (localMd5 === vpsMd5) {
            console.log('SUCCESS: MD5 MATCH!');
            console.log('Restarting backend...');
            await ssh.execCommand('pm2 restart man2man-backend');
        } else {
            console.error('CRITICAL: MD5 MISMATCH!');
            console.log('VPS Content length:', resMd5.stdout.length);
        }

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
robustRestore();
