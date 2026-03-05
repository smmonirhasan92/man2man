const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkDB() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });

        const testScript = `
        require('dotenv').config({path: '/var/www/man2man/backend/.env'});
        const mongoose = require('mongoose');
        mongoose.connect(process.env.MONGODB_URI).then(async () => {
            const SystemSetting = require('./modules/settings/SystemSettingModel');
            try {
                const min = await SystemSetting.findOne({key: 'p2p_market_min'});
                const max = await SystemSetting.findOne({key: 'p2p_market_max'});
                const usd_bdt = await SystemSetting.findOne({key: 'usd_to_bdt_rate'});
                console.log("==> SETTINGS IN DB:");
                console.log("MIN:", min ? min.value : 'NOT SET');
                console.log("MAX:", max ? max.value : 'NOT SET');
                console.log("USD_BDT:", usd_bdt ? usd_bdt.value : 'NOT SET');
            } catch(e) {
                console.log("==> ERROR:", e);
            }
            process.exit(0);
        });
        `;

        await ssh.execCommand(`echo "${testScript.split('\n').join('\\n').replace(/"/g, '\\"')}" > check_db.js`, { cwd: '/var/www/man2man/backend' });
        const r2 = await ssh.execCommand('node check_db.js', { cwd: '/var/www/man2man/backend' });
        console.log(r2.stdout);
        console.log(r2.stderr);

        ssh.dispose();
    } catch (err) {
        console.log(err);
    }
}
checkDB();
