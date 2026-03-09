const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function grabLogs() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        console.log("--- FINDING LOG PATHS ---");
        const jlist = await ssh.execCommand('pm2 jlist');
        const app = JSON.parse(jlist.stdout).find(a => a.name.includes('backend'));

        if (app) {
            console.log("Error Log:", app.pm2_env.pm_err_log_path);
            const err = await ssh.execCommand(`tail -n 100 ${app.pm2_env.pm_err_log_path}`);
            console.log("ERRORS:\n", err.stdout);

            console.log("Out Log:", app.pm2_env.pm_out_log_path);
            const out = await ssh.execCommand(`tail -n 100 ${app.pm2_env.pm_out_log_path}`);
            console.log("OUTPUT (AI):\n", out.stdout);
        }

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
grabLogs();
