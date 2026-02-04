require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const UserPlan = require('../modules/plan/UserPlanModel'); // Check if this path is correct relative to script
const User = require('../modules/user/UserModel');
const Transaction = require('../modules/wallet/TransactionModel');
// const TaskLog = ... will add if found.

const P2POrder = require('../modules/p2p/P2POrderModel');
const P2PTrade = require('../modules/p2p/P2PTradeModel');
const P2PMessage = require('../modules/p2p/P2PMessageModel');

const resetSystem = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/man2man');
        console.log("🔥 Connected to DB. Initiating FACTORY RESET (v2 - Complete)...");

        // 1. CLEAR USER PLANS
        const plans = await UserPlan.deleteMany({});
        console.log(`✅ Deleted ${plans.deletedCount} User Plans.`);

        // 2. CLEAR TRANSACTIONS
        const txs = await Transaction.deleteMany({});
        console.log(`✅ Deleted ${txs.deletedCount} Transactions.`);

        // 3. CLEAR P2P DATA (Fixes 403/Stale Data)
        const orders = await P2POrder.deleteMany({});
        const trades = await P2PTrade.deleteMany({});
        const msgs = await P2PMessage.deleteMany({});
        console.log(`✅ Deleted P2P Data: ${orders.deletedCount} Orders, ${trades.deletedCount} Trades, ${msgs.deletedCount} Messages.`);

        // 4. RESET USERS
        const users = await User.updateMany({}, {
            $set: {
                wallet_balance: 0,
                purchase_balance: 0,
                active_plan_id: null,
                synthetic_phone: null,
                usa_connected: false,
                usa_verified_date: null,
                tasks_completed_today: 0,
                earnings_today: 0,
                last_task_date: null,
                trustScore: 5.0, // Reset Trust
                ratingCount: 0
            }
        });
        console.log(`✅ Reset ${users.modifiedCount} Users to Factory settings.`);

        console.log("🚀 SYSTEM RESET COMPLETE. READY FOR NEW DEPLOYMENTS.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

resetSystem();
