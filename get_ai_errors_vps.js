const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function getAiErrors() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
        });

        console.log("--- PM2 JSON List (Log Paths) ---");
        const jlistRes = await ssh.execCommand('pm2 jlist');
        const apps = JSON.parse(jlistRes.stdout);
        const app = apps.find(a => a.name.includes('backend'));

        if (app) {
            console.log("Reading Logs for AI tags...");
            const outCmd = `grep "\\[AI\\]" ${app.pm2_env.pm_out_log_path}`;
            const errCmd = `grep "\\[AI\\]" ${app.pm2_env.pm_err_log_path}`;

            const outLog = await ssh.execCommand(outCmd);
            console.log("OUT LOG AI TAGS:\n", outLog.stdout || "None");

            const errLog = await ssh.execCommand(errCmd);
            console.log("ERR LOG AI TAGS:\n", errLog.stdout || "None");
        } else {
            console.log("Backend process not found in PM2");
        }

    } catch (e) {
        console.error("SSH Error:", e);
    } finally {
        ssh.dispose();
    }
}

getAiErrors();
