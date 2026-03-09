const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function run() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123'
        });

        console.log('--- Definitively Checking Remaining Users ---');
        // We run a node script on the VPS that uses the same logic as the reset script to check counts
        const script = `
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: '/var/www/man2man/backend/.env' });
async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/man2man');
        const users = await mongoose.connection.db.collection('users').find({}, { projection: { username: 1, role: 1 } }).toArray();
        console.log('USER_JSON_START' + JSON.stringify(users) + 'USER_JSON_END');
    } catch (e) { console.error(e); } finally { await mongoose.disconnect(); }
}
check();
        `;

        await ssh.execCommand("echo '" + script.replace(/'/g, "'\\''") + "' > /tmp/check_users.js");
        const res = await ssh.execCommand('node /tmp/check_users.js', { cwd: '/var/www/man2man/backend' });

        console.log('Raw Output:', res.stdout);
        const match = res.stdout.match(/USER_JSON_START(.*?)USER_JSON_END/);
        if (match) {
            const users = JSON.parse(match[1]);
            console.log('Verification Result:', users.length, 'users remaining.');
            users.forEach(u => console.log(` - ${u.username} (${u.role})`));
        } else {
            console.log('Could not parse user list. Output:', res.stdout, res.stderr);
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        ssh.dispose();
    }
}

run();
