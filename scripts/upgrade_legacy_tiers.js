const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model('User', userSchema, 'users');

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/universal_game_core_v1');
        console.log('Connected to DB for Tier Migration');

        const users = await User.find({ active_plans: { $exists: true, $ne: [] } });
        let goldCount = 0;
        let platCount = 0;

        for (const user of users) {
            // Use .toObject() or just access properties safely
            const uData = user.toObject ? user.toObject() : user;
            const activePlans = uData.active_plans || [];
            
            let maxNodePrice = 0;
            for (const plan of activePlans) {
                if (plan.unlock_price && plan.unlock_price > maxNodePrice) {
                    maxNodePrice = plan.unlock_price;
                }
            }

            let newTier = 'Silver';
            if (maxNodePrice >= 2200) { // Ultra Node(2200) or Omega Node(2900) -> Platinum
                newTier = 'Platinum';
            } else if (maxNodePrice >= 990) { // Lite Node(990) or Turbo(1500) -> Gold
                newTier = 'Gold';
            }

            const currentTier = (uData.taskData && uData.taskData.accountTier) ? uData.taskData.accountTier : 'Silver';
            
            // Upgrade logic (don't downgrade if they already have a higher tier somehow)
            if (newTier !== currentTier) {
                if (newTier === 'Platinum' || (newTier === 'Gold' && currentTier !== 'Platinum')) {
                    await User.updateOne(
                        { _id: user._id },
                        { $set: { 'taskData.accountTier': newTier } }
                    );
                    console.log(`Upgraded user ${uData.phone} to ${newTier} (Max Node Price: ${maxNodePrice})`);
                    if (newTier === 'Platinum') platCount++;
                    if (newTier === 'Gold') goldCount++;
                }
            }
        }
        console.log(`Migration done. Upgraded to Gold: ${goldCount}, Upgraded to Platinum: ${platCount}`);
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

migrate();
