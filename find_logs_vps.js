const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function findLogs() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
        });

        console.log("--- PM2 JSON List ---");
        const jlist = await ssh.execCommand('pm2 jlist');
        const apps = JSON.parse(jlist.stdout);
        const backend = apps.find(a => a.name === 'backend');

        if (backend) {
            console.log("Error Log:", backend.pm2_env.pm_err_log_path);
            console.log("Out Log:", backend.pm2_env.pm_out_log_path);

            const err = await ssh.execCommand(`tail -n 100 ${backend.pm2_env.pm_err_log_path}`);
            console.log("ERROR LOG:\n", err.stdout);

            const out = await ssh.execCommand(`tail -n 100 ${backend.pm2_env.pm_out_log_path}`);
            console.log("OUT LOG:\n", out.stdout);
        } else {
            console.log("Backend process not found in PM2");
        }

    } catch (err) {
        console.error("SSH Error:", err);
    } finally {
        ssh.dispose();
    }
}

findLogs();
