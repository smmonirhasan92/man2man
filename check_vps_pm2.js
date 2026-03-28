const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const ssh = new NodeSSH();

async function checkLog() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        const res3 = await ssh.execCommand('ls -l /root/.pm2/logs/');
        
        // It seems the backend is 'man2man-backend' or 'man2man-error'
        // Let's get the list of apps and their error logs.
        const resApps = await ssh.execCommand('pm2 jlist');
        let pm2Status = resApps.stdout;

        let errorLogs = {};
        try {
            const apps = JSON.parse(resApps.stdout);
            for (let app of apps) {
                const logFile = app.pm2_env.pm_err_log_path;
                const errRes = await ssh.execCommand('cat ' + logFile + ' | tail -n 50');
                errorLogs[app.name] = errRes.stdout + errRes.stderr;
            }
        } catch(e) {}

        const output = {
            ls: res3.stdout,
            pm2_status: pm2Status,
            error_logs: errorLogs
        };
        
        fs.writeFileSync('d:\\man2man\\vps_logs.json', JSON.stringify(output, null, 2));

        ssh.dispose();
    } catch (err) {
        console.error(err);
        ssh.dispose();
    }
}
checkLog();
