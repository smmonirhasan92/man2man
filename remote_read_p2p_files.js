const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function readVpsFiles() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });
        
        const files = [
            '/var/www/man2man/frontend/components/p2p/P2PChatRoom.js',
            '/var/www/man2man/backend/modules/p2p/P2PService.js',
            '/var/www/man2man/frontend/hooks/useNotification.js',
            '/var/www/man2man/frontend/context/NotificationContext.js'
        ];

        for (const file of files) {
            console.log(`--- FILE: ${file} ---`);
            const res = await ssh.execCommand(`cat ${file}`);
            console.log(res.stdout);
            console.log('\n\n');
        }
        
        ssh.dispose();
    } catch (err) {
        console.error('Read Failed:', err);
        ssh.dispose();
    }
}

readVpsFiles();
