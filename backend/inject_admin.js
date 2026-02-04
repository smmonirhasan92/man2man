const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Define Schema Inline to avoid require errors
const userSchema = new mongoose.Schema({
    wallet: {
        game: { type: Number, default: 0 },
        main: { type: Number, default: 0 }
    }
}, { strict: false });

const User = mongoose.model('User', userSchema);

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("DB Connected");

        // Find last updated user
        const user = await User.findOne().sort({ updatedAt: -1 });

        if (user) {
            console.log(`FOUND_USER_ID: ${user._id}`);
            user.wallet.game = 5000;
            user.wallet.main = 5000;
            user.markModified('wallet');
            await user.save();
            console.log("BALANCE_UPDATED_TO_5000");
        } else {
            console.log("NO_USER");
        }
    } catch (e) {
        console.error("ERROR:", e);
    }
    process.exit();
}
run();
