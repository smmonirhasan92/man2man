const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' });

const connectDB = require('../kernel/database');
const User = require('../modules/user/UserModel');
const Transaction = require('../modules/wallet/TransactionModel');
const userController = require('../controllers/userController');
const adminController = require('../controllers/adminController');

// Mock Req/Res
const mockReqRes = (query = {}, body = {}, user = {}, params = {}) => {
    const req = { query, body, user: { user }, params };
    const res = {
        json: (d) => { res.body = d; return res; },
        status: (c) => { res.statusCode = c; return res; }
    };
    return { req, res };
};

async function runTest() {
    await connectDB();
    console.log('--- STARTING ADMIN REVAMP VERIFICATION ---');

    console.log('[1] Setup Test Users...');
    await User.deleteMany({ username: { $in: ['search_target', 'search_noise'] } });

    const target = await User.create({
        fullName: 'Target User', username: 'search_target', email: 'target@example.com',
        phone: '1234567890', password: 'hash', role: 'user', country: 'US',
        wallet: { main: 100 }
    });

    await User.create({
        fullName: 'Noise User', username: 'search_noise', email: 'noise@example.com',
        phone: '0987654321', password: 'hash', role: 'user', country: 'US'
    });

    console.log('[2] Verifying Search (By Email)...');
    const { req: searchReq, res: searchRes } = mockReqRes({ search: 'target@example' });
    await userController.getAllUsers(searchReq, searchRes);

    if (searchRes.body.length === 1 && searchRes.body[0].username === 'search_target') {
        console.log('✅ PASS: Found user by partial Email.');
    } else {
        console.error(`❌ FAIL: Search returned ${searchRes.body.length} results.`);
    }

    console.log('[3] Verifying Search (By Phone)...');
    const { req: phoneReq, res: phoneRes } = mockReqRes({ search: '12345' });
    await userController.getAllUsers(phoneReq, phoneRes);

    if (phoneRes.body.length === 1 && phoneRes.body[0].username === 'search_target') {
        console.log('✅ PASS: Found user by partial Phone.');
    } else {
        console.error(`❌ FAIL: Phone Search returned ${phoneRes.body.length} results.`);
    }

    console.log('[4] Verifying Balance Adjustment (Card Action)...');
    // Simulate Admin adding 50 Credits
    const { req: balReq, res: balRes } = mockReqRes({}, { amount: 50, type: 'credit', comment: 'Test Add' }, { id: 'admin_id' }, { id: target._id });

    // Check if adminController handles session correctly (Standalone Mode)
    // adminController.updateUserBalance uses startSession. 
    // If it fails on standalone, we might need the same refactor as before.
    // Let's test it.
    try {
        await adminController.updateUserBalance(balReq, balRes);
    } catch (e) {
        console.log('⚠️ Caught Error (likely Transaction):', e.message);
    }

    // Check Result directly in DB
    const finalUser = await User.findById(target._id);
    const logs = await Transaction.find({ userId: target._id, type: 'admin_adjustment' });

    if (finalUser.wallet.main === 150) {
        console.log('✅ PASS: Wallet Balance Updated to 150.');
    } else {
        // If transaction failed, it might be 100.
        console.error(`❌ FAIL: Wallet Balance is ${finalUser.wallet.main} (Expected 150). Transaction issue?`);
    }

    if (logs.length > 0) {
        console.log('✅ PASS: Transaction Log Found.');
    } else {
        console.error('❌ FAIL: No Transaction Log created.');
    }

    console.log('--- VERIFICATION COMPLETE ---');
    process.exit(0);
}

runTest().catch(console.error);
