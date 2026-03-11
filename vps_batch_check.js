const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function check() {
    await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123', port: 22 });

    console.log('--- FINAL CODE VERIFICATION (TaskService) ---');
    const r = await ssh.execCommand('grep "batched_daily_task_reward" /var/www/man2man/backend/modules/task/TaskService.js');
    console.log(r.stdout.trim() || 'NOT FOUND!');

    console.log('\n--- FINAL CODE VERIFICATION (ReferralService) ---');
    const r2 = await ssh.execCommand('grep "batched_daily_task_reward" /var/www/man2man/backend/modules/referral/ReferralService.js');
    console.log(r2.stdout.trim() || 'NOT FOUND!');

    ssh.dispose();
}

check().catch(console.error);
