const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const crypto = require('crypto');
const ssh = new NodeSSH();

async function syncPlanService() {
    try {
        const localPath = 'd:\\man2man\\backend\\modules\\plan\\PlanService.js';
        const localContent = fs.readFileSync(localPath, 'utf8');
        const localMd5 = crypto.createHash('md5').update(localContent).digest('hex');
        console.log('LOCAL MD5:', localMd5);

        const base64Content = Buffer.from(localContent).toString('base64');

        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('Restoring PlanService.js...');
        await ssh.execCommand(`echo "${base64Content}" > /tmp/PlanService.js.b64`);
        await ssh.execCommand('base64 -d /tmp/PlanService.js.b64 > /var/www/man2man/backend/modules/plan/PlanService.js');
        
        console.log('Verifying VPS MD5...');
        const resMd5 = await ssh.execCommand('md5sum /var/www/man2man/backend/modules/plan/PlanService.js');
        const vpsMd5 = resMd5.stdout.split(' ')[0];
        console.log('VPS MD5:', vpsMd5);
        
        if (localMd5 === vpsMd5) {
            console.log('SUCCESS: MD5 MATCH!');
            console.log('Restarting backend...');
            await ssh.execCommand('pm2 restart man2man-backend');
        } else {
            console.error('CRITICAL: MD5 MISMATCH!');
        }

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
syncPlanService();
