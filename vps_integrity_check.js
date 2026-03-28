const { NodeSSH } = require('node-ssh');
const crypto = require('crypto');
const fs = require('fs');
const ssh = new NodeSSH();

async function integrityCheck() {
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
        
        console.log('--- VPS SERVER.JS AUDIT ---');
        const resMd5 = await ssh.execCommand('md5sum /var/www/man2man/backend/server.js');
        console.log('VPS MD5:', resMd5.stdout);

        const resTail = await ssh.execCommand('tail -n 20 /var/www/man2man/backend/server.js');
        console.log('VPS TAIL:', resTail.stdout);

        const resLogs = await ssh.execCommand('pm2 logs man2man-backend --lines 100 --no-daemon');
        console.log('VPS RECENT LOGS:', resLogs.stdout);

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
integrityCheck();
