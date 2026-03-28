const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const ssh = new NodeSSH();

(async () => {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });
        
        console.log('--- Uploading patched adminController.js ---');
        await ssh.putFile('d:/man2man/adminController_vps.js', '/var/www/man2man/backend/controllers/adminController.js');
        
        console.log('--- Restarting Backend ---');
        await ssh.execCommand('pm2 restart man2man-backend');
        console.log('Backend restarted successfully.');
        
        ssh.dispose();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
