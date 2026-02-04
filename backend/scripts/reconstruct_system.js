const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const connectDB = require('../kernel/database');
const User = require('../modules/user/UserModel');
const TransactionLedger = require('../modules/wallet/TransactionLedgerModel');

const run = async () => {
    try {
        console.log("⚠️  INITIATING SYSTEM RECONSTRUCTION...");
        await connectDB();

        // 1. TOTAL WIPE
        console.log("🧨 Dropping Database...");
        await mongoose.connection.db.dropDatabase();
        console.log("✅ Database Wiped.");

        // 2. CREATE SUPER ADMIN
        const adminEmail = "admin@centralbank.com";
        const adminPass = "admin123";

        // Create User
        const admin = await User.create({
            username: "CentralBank_Admin",
            email: adminEmail,
            password: adminPass, // Should be hashed in real app via pre-save
            role: "super_admin",
            wallet: {
                main: 1000000, // Initial Mint
                bonus: 0,
                commission: 0
            }
        });

        console.log(`👑 Super Admin Created: ${admin.username} (${admin._id})`);

        // 3. LEDGER ENTRY (MINTING)
        // Minting is a special case where balance before is 0? Or technically checking against user state.
        // For the first one, let's assume Before=0, Amount=1000000.

        await TransactionLedger.create({
            userId: admin._id,
            type: 'mint',
            amount: 1000000,
            fee: 0,
            balanceBefore: 0,
            balanceAfter: 1000000,
            description: "Genesis Minting",
            transactionId: "GENESIS_" + Date.now()
        });

        console.log("📒 Genesis Ledger Entry Verified.");

        // 4. Create a Test User for P2P
        const user = await User.create({
            username: "Trader_Joe",
            email: "user@test.com",
            password: "password",
            role: "user",
            wallet: { main: 500, escrow_locked: 0 }
        });

        await TransactionLedger.create({
            userId: user._id,
            type: 'mint_seed', // Admin injection
            amount: 500,
            fee: 0,
            balanceBefore: 0,
            balanceAfter: 500,
            description: "Seed Funds",
            transactionId: "SEED_" + Date.now()
        });

        console.log(`👤 Test User Created: ${user.username}`);
        console.log("✅ SYSTEM RECONSTRUCTION COMPLETE.");
        process.exit(0);
    } catch (e) {
        console.error("❌ RECONSTRUCTION FAILED:", e);
        process.exit(1);
    }
};
run();
