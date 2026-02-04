const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

// Simple Inline Schema
const UserSchema = new mongoose.Schema({
    primary_phone: String,
    fullName: String,
    wallet: {
        main: Number,
        game: Number,
        income: Number,
        main_balance: Number
    },
    agent_balance: Number
}, { strict: false });

const User = mongoose.model('User', UserSchema);

const uri = "mongodb://localhost:27017/universal_game_core_v1";

async function fix() {
    try {
        await mongoose.connect(uri);
        console.log('Connected to universal_game_core_v1');

        const user = await User.findOne({ fullName: { $regex: 'Test User 55', $options: 'i' } });
        if (!user) {
            console.log('User not found');
            return;
        }

        console.log('User Found:', user.fullName, 'ID:', user._id);
        console.log('Current Wallet:', user.wallet);

        await User.updateOne(
            { _id: user._id },
            {
                $set: { "wallet.main": 50000, "wallet.game": 50000 },
                $unset: { "wallet.main_balance": "", "agent_balance": "" }
            }
        );
        console.log('Forced Update to 50000.');

        const check = await User.findById(user._id);
        console.log('New Wallet State:', check.wallet);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
fix();
