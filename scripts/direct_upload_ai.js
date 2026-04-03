const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const path = require('path');

async function directUpload() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
        });

        console.log("--- Uploading SystemBrainService.js ---");
        const localPath = 'd:\\man2man\\backend\\modules\\ai\\SystemBrainService.js';
        const remotePath = '/var/www/man2man/backend/modules/ai/SystemBrainService.js';

        await ssh.putFile(localPath, remotePath);
        console.log("Upload Success.");

        console.log("--- Restarting Backend ---");
        await ssh.execCommand('pm2 restart man2man-backend');

        console.log("--- Final Cat Verification ---");
        const res = await ssh.execCommand('cat /var/www/man2man/backend/modules/ai/SystemBrainService.js');
        // We log every character to be sure
        console.log(res.stdout);

    } catch (err) {
        console.error("SSH Error:", err);
    } finally {
        ssh.dispose();
    }
}

directUpload();
