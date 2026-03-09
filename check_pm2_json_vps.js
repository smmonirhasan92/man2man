const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkPm2Json() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
        });

        console.log("--- PM2 JSON List ---");
        const jlist = await ssh.execCommand('pm2 jlist');
        const apps = JSON.parse(jlist.stdout);
        console.log("Apps found:", apps.map(a => `${a.name} (${a.pm2_env.status})`).join(', '));

        const frontend = apps.find(a => a.name === 'man2man-frontend');
        if (frontend) {
            console.log("Frontend Status:", frontend.pm2_env.status);
            console.log("Frontend Error Path:", frontend.pm2_env.pm_err_log_path);
            const err = await ssh.execCommand(`tail -n 100 ${frontend.pm2_env.pm_err_log_path}`);
            console.log("FRONTEND ERROR LOG:\n", err.stdout);
        } else {
            console.log("man2man-frontend NOT FOUND IN PM2. Trying to start from ecosystem...");
            const start = await ssh.execCommand('pm2 start ecosystem.config.js', { cwd: '/var/www/man2man' });
            console.log(start.stdout);
        }

    } catch (err) {
        console.error("SSH Error:", err);
    } finally {
        ssh.dispose();
    }
}

checkPm2Json();
