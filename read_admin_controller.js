const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

ssh.connect({
    host: '76.13.244.202',
    username: 'root',
    password: 'Sir@@@admin123'
}).then(async () => {
    
    // Download the file to see the duplicate declaration
    console.log('=== adminController.js lines 600-630 ===');
    const res = await ssh.execCommand('sed -n "590,640p" /var/www/man2man/backend/controllers/adminController.js');
    console.log(res.stdout);

    ssh.dispose();
}).catch(e => { console.error(e.message); process.exit(1); });
