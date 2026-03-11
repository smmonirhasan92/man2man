const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function test() {
    await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });

    console.log('--- FETCHING USER LIST ---');
    const r = await ssh.execCommand('curl -s http://localhost:5000/api/admin/users?limit=1');
    console.log('Raw List Response:', r.stdout);

    let userId;
    try {
        const data = JSON.parse(r.stdout);
        userId = data.users[0]._id;
    } catch (e) {
        console.error('Failed to parse user list');
        ssh.dispose();
        return;
    }

    console.log(`--- API TEST FOR USER: ${userId} ---`);
    const r2 = await ssh.execCommand(`curl -s http://localhost:5000/api/admin/users/${userId}`);
    console.log('Raw Profile Response:', r2.stdout);

    try {
        const profile = JSON.parse(r2.stdout);
        console.log('Financials:', JSON.stringify(profile.financials, null, 2));
    } catch (e) {
        console.error('Failed to parse user profile');
    }

    ssh.dispose();
}

test().catch(console.error);
