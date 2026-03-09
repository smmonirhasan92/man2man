const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkStatus() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
        });

        console.log("--- PM2 LIST ---");
        const list = await ssh.execCommand('pm2 list');
        console.log(list.stdout);

        console.log("--- PM2 SHOW BACKEND ---");
        const show = await ssh.execCommand('pm2 show backend');
        console.log(show.stdout);

        console.log("--- TAIL ERROR LOGS ---");
        const err = await ssh.execCommand('pm2 logs backend --lines 100 --nostream --no-colors');
        console.log(err.stdout);
        console.log(err.stderr);

    } catch (err) {
        console.error("SSH Error:", err);
    } finally {
        ssh.dispose();
    }
}

checkStatus();
