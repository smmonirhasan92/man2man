const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkLog() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        const res = await ssh.execCommand('pm2 logs frontend --lines 50 --nostream');
        require('fs').writeFileSync('frontend_log.txt', res.stdout + '\n' + res.stderr);
        console.log("Log saved to frontend_log.txt");
        ssh.dispose();
    } catch (err) {
        console.error('Failed:', err);
        ssh.dispose();
    }
}
checkLog();
