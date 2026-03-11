const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function check() {
    await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });

    console.log('--- FRONTEND ENV CHECK ---');
    const r = await ssh.execCommand('cat /var/www/man2man/frontend/.env');
    console.log(r.stdout.trim() || 'No frontend .env');

    console.log('\n--- API TEST (PORT 5050) ---');
    const r2 = await ssh.execCommand('curl -s http://localhost:5050/api/admin/users?limit=1');
    console.log('Raw List Response:', r2.stdout.trim());

    if (r2.stdout.trim()) {
        try {
            const data = JSON.parse(r2.stdout);
            const userId = data.users[0]._id;
            console.log(`\n--- API TEST FOR USER: ${userId} ---`);
            const r3 = await ssh.execCommand(`curl -s http://localhost:5050/api/admin/users/${userId}`);
            const profile = JSON.parse(r3.stdout);
            console.log('Financials Currency Ratio:', profile.financials?.currencyRatio);
            console.log('Net Accounting (Normalized):', profile.financials?.netAccounting);
        } catch (e) {
            console.log('Parse error:', e.message);
        }
    }

    ssh.dispose();
}

check().catch(console.error);
