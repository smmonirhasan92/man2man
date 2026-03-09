const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkCase() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        console.log("--- CASE CHECK ---");
        const res = await ssh.execCommand('find /var/www/man2man/backend -iname "*support*"');
        console.log(res.stdout);

        console.log("--- EXACT SERVER.JS REQUIRE LINE ---");
        const grep = await ssh.execCommand('grep -n "support" /var/www/man2man/backend/server.js');
        console.log(grep.stdout);

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
checkCase();
