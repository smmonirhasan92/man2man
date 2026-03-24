const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkCounts() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
            port: 22
        });
        
        const countScript = `
const mongoose = require('mongoose');
async function run() {
    const uri = "mongodb://127.0.0.1:27017/universal_game_core_v1";
    await mongoose.connect(uri);
    const plans = await mongoose.connection.db.collection('plans').countDocuments({});
    const taskads = await mongoose.connection.db.collection('taskads').countDocuments({});
    const pools = await mongoose.connection.db.collection('investmentpools').countDocuments({});
    console.log('--- COUNTS ---');
    console.log('Plans:', plans);
    console.log('Tasks:', taskads);
    console.log('Pools:', pools);
    process.exit(0);
}
run();
        `;
        
        await ssh.execCommand(`echo "${countScript.replace(/"/g, '\\"').replace(/\$/g, '\\$')}" > temp_check.js`, { cwd: '/var/www/man2man/backend' });
        const result = await ssh.execCommand('node temp_check.js', { cwd: '/var/www/man2man/backend' });
        console.log(result.stdout);
        ssh.dispose();
    } catch (err) {
        console.error('Check Failed:', err);
        ssh.dispose();
    }
}

checkCounts();
