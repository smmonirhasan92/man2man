const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function readLogsDirectly() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        console.log("--- PM2 JSON List (Log Paths) ---");
        const jlistRes = await ssh.execCommand('pm2 jlist');
        const apps = JSON.parse(jlistRes.stdout);
        const app = apps.find(a => a.name === 'man2man-backend');

        if (app) {
            const errPath = app.pm2_env.pm_err_log_path;
            const outPath = app.pm2_env.pm_out_log_path;

            console.log("Reading Error Log:", errPath);
            const errLog = await ssh.execCommand(`tail -n 100 ${errPath}`);
            console.log(errLog.stdout);

            console.log("Reading Out Log:", outPath);
            const outLog = await ssh.execCommand(`tail -n 100 ${outPath}`);
            console.log(outLog.stdout);
        } else {
            console.log("App not found in PM2");
        }

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
readLogsDirectly();
