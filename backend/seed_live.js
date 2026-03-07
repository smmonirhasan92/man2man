require('dotenv').config({ path: '/var/www/man2man/backend/.env' });
const mongoose = require('mongoose');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1');
    const db = mongoose.connection.db;

    console.log('Wiping old plans and tasks on Live Server...');
    await db.collection('plans').deleteMany({});
    await db.collection('taskads').deleteMany({});

    // 1. Insert Plans
    const plans = [
        { name: 'Micro Node', type: 'server', unlock_price: 250, price_usd: 5.00, daily_limit: 5, task_reward: 4.5, validity_days: 15, is_active: true, server_id: 'SERVER_01', features: ['Dedicated Proxy', 'Daily Payouts'] },
        { name: 'Starter Node', type: 'server', unlock_price: 350, price_usd: 7.00, daily_limit: 5, task_reward: 4.8, validity_days: 20, is_active: true, server_id: 'SERVER_02', features: ['Secure Node', 'Faster Networking'] },
        { name: 'Basic Node', type: 'server', unlock_price: 500, price_usd: 10.00, daily_limit: 8, task_reward: 3.5, validity_days: 25, is_active: true, server_id: 'SERVER_03', features: ['High Yield', 'Priority Withdrawals'] },
        { name: 'Pro Node', type: 'server', unlock_price: 750, price_usd: 15.00, daily_limit: 10, task_reward: 3.2, validity_days: 30, is_active: true, server_id: 'SERVER_04', features: ['Enterprise Protocol', 'Zero Fees'] },
        { name: 'Max Node', type: 'server', unlock_price: 1000, price_usd: 20.00, daily_limit: 12, task_reward: 3.2, validity_days: 35, is_active: true, server_id: 'SERVER_05', features: ['Quantum Security', 'Ultimate Payouts'] }
    ];
    await db.collection('plans').insertMany(plans);
    console.log('Seeded 5 new plans to Hostinger DB.');

    // 2. Insert Tasks
    const tasks = [];
    const taskConfig = [
        { server_id: 'SERVER_01', count: 5, reward: 4.5, title: 'Micro Validation Task' },
        { server_id: 'SERVER_02', count: 5, reward: 4.8, title: 'Starter Network Sync' },
        { server_id: 'SERVER_03', count: 8, reward: 3.5, title: 'Basic Node Request' },
        { server_id: 'SERVER_04', count: 10, reward: 3.2, title: 'Pro Packet Inspection' },
        { server_id: 'SERVER_05', count: 12, reward: 3.2, title: 'Max Decryption Sequence' }
    ];

    for (const config of taskConfig) {
        for (let i = 1; i <= config.count; i++) {
            tasks.push({
                title: `${config.title} #${i}`,
                url: 'https://support.google.com',
                imageUrl: '',
                duration: 15,
                reward_amount: config.reward,
                server_id: config.server_id,
                type: 'ad_view',
                is_active: true,
                priority: 100,
                valid_plans: [],
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }
    }

    await db.collection('taskads').insertMany(tasks);
    console.log('Seeded ' + tasks.length + ' standard tasks.');
    process.exit(0);
}
run();
