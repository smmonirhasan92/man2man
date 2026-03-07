const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const Transaction = require('../modules/wallet/TransactionModel');
const P2POrder = require('../modules/p2p/P2POrderModel');
const Notification = require('../modules/notification/NotificationModel');

async function resetSystem() {
    console.log("=========================================");
    console.log("🚨 WARNING: INITIATING PRODUCTION RESET 🚨");
    console.log("=========================================");

    try {
        await mongoose.connect(process.env.DB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("✅ Database Connected.");

        // 1. Delete all users EXCEPT 'super_admin'
        const usersDeleted = await User.deleteMany({ role: { $ne: 'super_admin' } });
        console.log(`🗑️ Deleted Users: ${usersDeleted.deletedCount}`);

        // 2. We should optionally reset the super_admin's wallet and stats to zero, but we will leave them intact 
        // to prevent accidentally ruining the admin's own manual setup or test balances.
        const admins = await User.find({ role: 'super_admin' });
        console.log(`🛡️ Protected Super Admins: ${admins.length}`);

        // 3. Delete all Transactions
        const txDeleted = (await Transaction.deleteMany({})).deletedCount;
        console.log(`🗑️ Deleted Transactions: ${txDeleted}`);

        // 4. Delete Withdrawals & Deposits (Merged into Transactions)
        console.log(`Notice: Withdrawals and Deposits are now managed within Transactions.`);

        // 5. Delete P2P Orders
        try {
            const p2pOrderDeleted = (await P2POrder.deleteMany({})).deletedCount;
            console.log(`🗑️ Deleted P2P Orders: ${p2pOrderDeleted}`);
        } catch (e) { console.log('Notice: P2P skip'); }

        // 6. Delete Lottery Tickets
        console.log('Notice: LotteryTicket model deprecated.');

        // 7. Delete Task Histories
        console.log('Notice: TaskHistory model deprecated.');

        // 8. Delete Notifications
        try {
            const notifDeleted = (await Notification.deleteMany({})).deletedCount;
            console.log(`🗑️ Deleted User Notifications: ${notifDeleted}`);
        } catch (e) { console.log('Notice: Notification skip'); }

        console.log("=========================================");
        console.log("✅ PRODUCTION RESET COMPLETED SUCCESSFULLY ✅");
        console.log("=========================================");

    } catch (err) {
        console.error("❌ Reset Error:", err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

resetSystem();
