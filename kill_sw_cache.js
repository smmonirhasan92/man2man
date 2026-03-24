const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function killSw() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        console.log('--- Phase 1: Removing Service Worker ---');
        await ssh.execCommand('rm /var/www/man2man/frontend/public/sw.js || echo "Already gone"');
        
        console.log('--- Phase 2: Create a Dummy (Self-Destruct) sw.js ---');
        // This script tells the browser to unregister the SW
        const workerKillScript = `
            self.addEventListener('install', (e) => {
                self.skipWaiting();
            });
            self.addEventListener('activate', (e) => {
                self.registration.unregister()
                    .then(() => self.clients.matchAll())
                    .then((clients) => {
                        clients.forEach(client => client.navigate(client.url))
                    });
            });
        `;
        await ssh.execCommand(`echo "${workerKillScript}" > /var/www/man2man/frontend/public/sw.js`);

        console.log('--- Phase 3: Fresh Install & Rebuild ---');
        await ssh.execCommand('cd /var/www/man2man/frontend && rm -rf .next && npm i && npm run build');
        await ssh.execCommand('pm2 restart all');

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
killSw();
