const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const ssh = new NodeSSH();

async function restorePackageJson() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('Restoring package.json...');
        const local = fs.readFileSync('d:\\man2man\\backend\\package.json', 'utf8');
        const b64 = Buffer.from(local).toString('base64');
        
        await ssh.execCommand(`echo "${b64}" > /tmp/package.json.b64`);
        await ssh.execCommand('base64 -d /tmp/package.json.b64 > /var/www/man2man/backend/package.json');
        
        console.log('Restarting backend...');
        await ssh.execCommand('pm2 restart man2man-backend');

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
restorePackageJson();
