const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkService() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        console.log("--- PM2 JLIST ---");
        const jlist = await ssh.execCommand('pm2 jlist');
        const apps = JSON.parse(jlist.stdout);
        const backend = apps.find(a => a.name.includes('backend'));

        if (backend) {
            console.log(`Backend Status: ${backend.pm2_env.status}`);
            console.log(`Error Log Path: ${backend.pm2_env.pm_err_log_path}`);

            console.log("\n--- LAST 20 ERRORS ---");
            const errs = await ssh.execCommand(`tail -n 20 ${backend.pm2_env.pm_err_log_path}`);
            console.log(errs.stdout);

            console.log("\n--- LAST 20 OUTPUTS ---");
            const outs = await ssh.execCommand(`tail -n 20 ${backend.pm2_env.pm_out_log_path}`);
            console.log(outs.stdout);
        } else {
            console.log("Backend process NOT FOUND in PM2");
        }

    } catch (e) { console.error(e); } finally { ssh.dispose(); }
}
checkService();
