const mongoose = require('mongoose');
const User = require('../modules/user/UserModel');
const PlanService = require('../modules/plan/PlanService');

// Hardcoded URI from previous context
const MONGO_URI = 'mongodb+srv://smmonirhasan92_db_user:xe83pvLwW1iLAhic@cluster0.ttzbkr2.mongodb.net/universal_game_core_v1';

async function verifyAuthLogic() {
    try {
        console.log('1. Connecting to DB...');
        await mongoose.connect(MONGO_URI);
        console.log('   -> Connected!');

        console.log('2. Creating/Finding Test User...');
        // Create a cleanup user to test with
        const testPhone = '9999999999';
        let user = await User.findOne({ primary_phone: testPhone });

        if (!user) {
            console.log('   -> Creating new user...');
            user = await User.create({
                fullName: 'Debug Bot',
                username: 'debugbot',
                primary_phone: testPhone,
                country: 'BD',
                password: 'hashed_placeholder',
                wallet: { main: 100, game: 0, income: 0, purchase: 0 }
            });
        }
        console.log('   -> User ID:', user._id.toString());

        console.log('3. Testing PlanService.checkProvisioning...');
        try {
            // Mimic auth.controller.js logic
            const status = await PlanService.checkProvisioning(user._id);
            console.log('   -> PlanService Result:', status);
        } catch (e) {
            console.error('   -> [CRITICAL FAIL] PlanService Crashed:', e.message);
            console.error(e);
        }

        console.log('4. Testing User.findById (GetMe Logic)...');
        try {
            const foundUser = await User.findById(user._id).select('-password');
            console.log('   -> User Found. Wallet:', foundUser.wallet);

            // Mimic Response Construction
            const userData = foundUser.toObject();
            const wallet = foundUser.wallet || {};

            const responsePayload = {
                wallet_balance: wallet.main || 0,
                w_dat: {
                    m_v: wallet.main || 0
                }
            };
            console.log('   -> Response Payload Constructed Successfully');

        } catch (e) {
            console.error('   -> [CRITICAL FAIL] User Lookup Crashed:', e.message);
            console.error(e);
        }

    } catch (err) {
        console.error('GLOBAL CRASH:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Done.');
    }
}

verifyAuthLogic();
