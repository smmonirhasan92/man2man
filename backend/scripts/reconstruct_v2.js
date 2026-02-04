const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const connectDB = require('../kernel/database');
const User = require('../modules/user/UserModel');
const TransactionLedger = require('../modules/wallet/TransactionLedgerModel');

const run = async () => {
    try {
        console.log("⚠️  INITIATING SYSTEM RECONSTRUCTION V2...");
        await connectDB();

        // 1. TOTAL WIPE
        console.log("🧨 Dropping Database...");
        if (mongoose.connection.readyState !== 1) throw new Error("DB Not Connected");
        await mongoose.connection.db.dropDatabase();
        console.log("✅ Database Wiped.");

        // 2. CREATE SUPER ADMIN
        const adminEmail = "admin@centralbank.com";
        const adminPass = "admin123";
        const adminPin = "0000"; // [SECURITY] Single PIN

        // Create User
        const admin = await User.create({
            username: "CentralBank_Admin",
            email: adminEmail,
            password: adminPass,
            adminPin: adminPin,
            role: "super_admin",
            wallet: {
                main: 1000000, // Initial Mint stored in wallet
                bonus: 0,
                commission: 0
            }
        });

        console.log(`👑 Super Admin Created: ${admin.username} (${admin._id})`);

        // 3. LEDGER ENTRY (MINTING)
        // Genesis Mint: Before 0 -> After 1000000
        await TransactionLedger.create({
            userId: admin._id,
            type: 'mint',
            amount: 1000000,
            fee: 0,
            balanceBefore: 0,
            balanceAfter: 1000000,
            description: "Genesis Minting V2",
            transactionId: "GENESIS_V2_" + Date.now()
        });

        console.log("📒 Genesis Ledger Entry Verified.");
        console.log("✅ SYSTEM RECONSTRUCTION V2 COMPLETE.");
        process.exit(0);
    } catch (e) {
        console.error("❌ RECONSTRUCTION FAILED:", e);
        process.exit(1);
    }
};
run();
