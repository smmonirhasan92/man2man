const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const path = require('path');
const ssh = new NodeSSH();

async function deepSync() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        const baseDir = 'd:\\man2man\\backend';
        const targetDir = '/var/www/man2man/backend';
        
        const foldersToSync = ['modules', 'routes', 'controllers', 'kernel', 'utils', 'config'];
        
        for (const folder of foldersToSync) {
            console.log(`Syncing folder: ${folder}...`);
            const localFolder = path.join(baseDir, folder);
            const remoteFolder = path.posix.join(targetDir, folder);
            
            // Recursive function to upload files
            async function uploadDir(localPath, remotePath) {
                const items = fs.readdirSync(localPath);
                for (const item of items) {
                    const localItemPath = path.join(localPath, item);
                    const remoteItemPath = path.posix.join(remotePath, item);
                    const stats = fs.statSync(localItemPath);
                    
                    if (stats.isDirectory()) {
                        await ssh.execCommand(`mkdir -p ${remoteItemPath}`);
                        await uploadDir(localItemPath, remoteItemPath);
                    } else if (stats.isFile() && item.endsWith('.js')) {
                        const content = fs.readFileSync(localItemPath, 'utf8');
                        const b64 = Buffer.from(content).toString('base64');
                        // Use a temp file to avoid huge command line arguments if possible
                        // But for small JS files, echo + base64 should be fine.
                        // However, to be extra safe, we'll use a temp file on the VPS.
                        await ssh.execCommand(`echo "${b64}" > /tmp/sync_tmp.b64`);
                        await ssh.execCommand(`base64 -d /tmp/sync_tmp.b64 > ${remoteItemPath}`);
                    }
                }
            }
            await uploadDir(localFolder, remoteFolder);
        }

        console.log('Cleanup: Deleting untracked chat module if it reappeared...');
        await ssh.execCommand('rm -rf /var/www/man2man/backend/modules/chat');

        console.log('Restarting backend...');
        await ssh.execCommand('pm2 restart man2man-backend');

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
deepSync();
