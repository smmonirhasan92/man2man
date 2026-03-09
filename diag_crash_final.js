const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function debugCrash() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
        });

        console.log("--- PM2 Status ---");
        const status = await ssh.execCommand('pm2 status');
        console.log(status.stdout);

        console.log("--- PM2 JSON List (Check Error Paths) ---");
        const jlist = await ssh.execCommand('pm2 jlist');
        const apps = JSON.parse(jlist.stdout);
        const backend = apps.find(a => a.name === 'backend');

        if (backend) {
            console.log("Error Log Path:", backend.pm2_env.pm_err_log_path);
            const errLog = await ssh.execCommand(`tail -n 100 ${backend.pm2_env.pm_err_log_path}`);
            console.log("ERROR LOG CONTENT:\n", errLog.stdout);

            const outLog = await ssh.execCommand(`tail -n 100 ${backend.pm2_env.pm_out_log_path}`);
            console.log("OUT LOG CONTENT:\n", outLog.stdout);
        } else {
            console.log("Backend process NOT found in PM2.");
        }

    } catch (err) {
        console.error("SSH Error:", err);
    } finally {
        ssh.dispose();
    }
}

debugCrash();
