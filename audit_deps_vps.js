const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function audit() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        const files = [
            '/var/www/man2man/backend/routes/supportRoutes.js',
            '/var/www/man2man/backend/controllers/supportController.js',
            '/var/www/man2man/backend/modules/support/SupportMessageModel.js',
            '/var/www/man2man/backend/middleware/authMiddleware.js',
            '/var/www/man2man/backend/middleware/roleMiddleware.js',
            '/var/www/man2man/backend/modules/user/UserModel.js'
        ];

        console.log('--- Dependency Audit ---');
        for (const f of files) {
            const res = await ssh.execCommand(`ls ${f}`);
            console.log(f + ': ' + (res.stdout || 'MISSING'));
        }

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
audit();
