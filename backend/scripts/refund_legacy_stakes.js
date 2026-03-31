const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const connectDB = require('../kernel/database');
const UserStake = require('../modules/staking/UserStakeModel');
const StakingPool = require('../modules/staking/StakingPoolModel');
const User = require('../modules/user/UserModel');
const Transaction = require('../modules/wallet/TransactionModel');
const SocketService = require('../modules/common/SocketService');

async function refundLegacy() {
    try {
        await connectDB();
        console.log("Connected to DB...");
        
        // Find all active stakes
        const activeStakes = await UserStake.find({ status: 'ACTIVE' });
        console.log(`Found ${activeStakes.length} total active stakes.`);

        let refundedCount = 0;

        for (const stake of activeStakes) {
            // Check if pool still exists
            const poolStillExists = await StakingPool.findById(stake.poolId);
            
            if (!poolStillExists) {
                console.log(`Legacy Stake Found (ID: ${stake._id}). Refunding user ${stake.userId}...`);
                
                // Refund Principal to Main Wallet
                const userUpd = await User.findByIdAndUpdate(stake.userId, {
                    $inc: {
                        'wallet.staked': -stake.stakedAmount,
                        'wallet.main': stake.stakedAmount
                    }
                }, { new: true });

                // Mark stake as cancelled/refunded
                stake.status = 'CANCELLED';
                stake.claimedAt = new Date();
                await stake.save();

                // Create Transaction Log
                await Transaction.create([{
                    userId: stake.userId,
                    amount: stake.stakedAmount,
                    type: 'system_refund',
                    description: `Staking Protocol V2 Upgrade: Prorated Principal Refund`,
                    source: 'system',
                    status: 'completed',
                    currency: 'NXS'
                }]);

                refundedCount++;
                console.log(`-> Refunded ${stake.stakedAmount} NXS to User ${stake.userId}.`);
            }
        }
        
        console.log(`V2 Migration Complete! Automatically refunded ${refundedCount} legacy stakes without penalty.`);
        process.exit(0);
    } catch (e) {
        console.error("Migration Error:", e);
        process.exit(1);
    }
}

refundLegacy();
