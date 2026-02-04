const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Force absolute paths to avoid confusion
const ROOT_DIR = __dirname;
const User = require(path.join(ROOT_DIR, 'modules/user/UserModel'));
const Transaction = require(path.join(ROOT_DIR, 'modules/payment/TransactionModel'));
const logger = require(path.join(ROOT_DIR, 'utils/logger'));

async function runCheckBoardTest() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1');
        console.log('✅ Connected to MongoDB');

        // 1. Create a Test User
        const testPhone = '01700000000';
        let user = await User.findOne({ primary_phone: testPhone });
        if (!user) {
            user = await User.create({
                fullName: 'Test Agent',
                phone: testPhone,
                username: 'tester01',
                password: 'password123',
                role: 'user',
                wallet: { main: 500, income: 0, game: 0 }
            });
            console.log('✅ Test User Created');
        } else {
            console.log('ℹ️ Test User Exists');
        }

        // 2. Simulate Deposit Request
        console.log('🔄 Simulating Deposit...');
        const trxId = 'TRX-' + Date.now();
        const deposit = await Transaction.create({
            user: user._id,
            type: 'add_money',
            amount: 1000,
            method: 'bkash',
            transactionId: trxId,
            status: 'pending',
            details: {
                recipientDetails: 'Sent to Personal',
                senderTrxId: 'TRX123456'
            }
        });
        console.log(`✅ Deposit Request Created: ${deposit._id}`);

        // 3. Log this Action (Simulating Controller Logic)
        logger.info('User Deposit Request', {
            meta: {
                userId: user._id,
                username: user.username,
                amount: 1000,
                trxId: trxId,
                type: 'deposit_request'
            }
        });
        console.log('✅ Action Logged to Winston');

        // 4. Verify History Log (Query System Logs)
        console.log('⏳ Waiting for log propagation...');
        await new Promise(r => setTimeout(r, 3000));

        const logs = await mongoose.connection.db.collection('system_logs').find({
            'meta.trxId': trxId
        }).toArray();

        // Log the actual content of the log for debugging
        if (logs.length > 0) {
            console.log('🎉 SUCCESS: History Log Found in MongoDB!');
            // console.log('Log Entry:', JSON.stringify(logs[0], null, 2));
        } else {
            console.error('❌ FAILURE: No History Log found for this transaction.');
        }

        // Cleanup
        await Transaction.deleteOne({ _id: deposit._id });
        console.log('🧹 Cleanup Done');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

runCheckBoardTest();
