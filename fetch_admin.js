const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

(async () => {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });
        const res = await ssh.execCommand('cat /var/www/man2man/backend/controllers/adminController.js');
        require('fs').writeFileSync('adminController_vps.js', res.stdout);
        console.log('Saved adminController_vps.js');
        ssh.dispose();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
