const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
const fs = require('fs');

async function syncFromVps() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });
        
        const files = [
            { remote: '/var/www/man2man/frontend/components/p2p/P2PChatRoom.js', local: 'd:/man2man/vps_P2PChatRoom.js' },
            { remote: '/var/www/man2man/frontend/components/p2p/P2PDashboard.js', local: 'd:/man2man/vps_P2PDashboard.js' },
            { remote: '/var/www/man2man/frontend/hooks/useNotification.js', local: 'd:/man2man/vps_useNotification.js' },
            { remote: '/var/www/man2man/frontend/context/NotificationContext.js', local: 'd:/man2man/vps_NotificationContext.js' }
        ];

        for (const f of files) {
            console.log(`Downloading ${f.remote}...`);
            await ssh.getFile(f.local, f.remote);
        }
        
        ssh.dispose();
        console.log('✅ Sync Complete.');
    } catch (err) {
        console.error('Sync Failed:', err);
        ssh.dispose();
    }
}

syncFromVps();
