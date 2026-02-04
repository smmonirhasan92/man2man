const mongoose = require('mongoose');
const path = require('path');
const User = require('../modules/user/UserModel');
const GamePoolService = require('../modules/game/GamePoolService');
const BonusVault = require('../modules/bonus/BonusVaultModel');
const withdrawalController = require('../controllers/withdrawalController'); // We might need to mock Req/Res

require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Mock Response
const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

async function runTest() {
    let connection = null;
    try {
        console.log('🔒 Testing Retention Engine...');
        connection = await mongoose.connect(process.env.MONGODB_URI);

        // 1. Create User
        const user = await User.create({
            username: `retain_${Date.now()}`,
            fullName: 'Retention Tester',
            phone: `01${Date.now().toString().slice(-9)}`,
            password: '123',
            country: 'BD',
            wallet: { main: 5000, turnoverCurrent: 0, turnoverRequired: 0 }
        });

        console.log('User Created. Wallet: 5000');

        // 2. Simulate Bet (Tax Check)
        const betAmount = 100;
        await GamePoolService.processVaultTax(betAmount);
        await GamePoolService.updateTurnover(user._id, betAmount);

        const vault = await BonusVault.findOne();
        console.log(`Vault Balance (Should be 5): ${vault.balance}`);

        // 3. Simulate Big Win (Lock Check)
        const winAmount = 2000; // > 1000 Threshold
        await GamePoolService.checkBigWinRetention(user._id, winAmount);

        const updatedUser = await User.findById(user._id);
        console.log(`User Turnover Req: ${updatedUser.wallet.turnoverRequired} (Expected 40000)`);
        console.log(`User Turnover Cur: ${updatedUser.wallet.turnoverCurrent} (Expected 100)`);

        // 4. Attempt Withdrawal (Should Fail)
        console.log('Attempting Withdrawal...');
        const req = {
            user: { user: { id: user._id } },
            body: { amount: 1000, method: 'bkash', accountDetails: '017000000', walletType: 'main' }
        };
        const res = mockRes();

        await withdrawalController.requestWithdrawal(req, res);

        if (res.statusCode === 403 && res.data.retentionLock) {
            console.log('✅ PASS: Withdrawal Blocked correctly.');
            console.log(`Message: ${res.data.message}`);
        } else {
            console.error('❌ FAIL: Withdrawal NOT blocked or wrong error.', res.data);
        }

        // Cleanup
        await User.findByIdAndDelete(user._id);
        console.log('Test Cleanup Done.');

    } catch (e) {
        console.error("Test Failed:", e);
    } finally {
        if (connection) await mongoose.disconnect();
        process.exit(0);
    }
}

runTest();
