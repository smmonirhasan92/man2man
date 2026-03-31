const mongoose = require('mongoose');
const StakingPool = require('./StakingPoolModel');
const UserStake = require('./UserStakeModel');
const User = require('../user/UserModel');
const Transaction = require('../wallet/TransactionModel');
const TransactionHelper = require('../common/TransactionHelper');

class StakingService {

    // --- 1. Get Available Pools ---
    async getAvailablePools() {
        return await StakingPool.find({ isActive: true }).sort({ durationDays: 1 });
    }

    // --- 2. Create Initial Pools (Seeding Admin feature or System Init) ---
    async seedDefaultPools() {
        const count = await StakingPool.countDocuments();
        if (count === 0) {
            await StakingPool.insertMany([
                { name: 'Starter Tier', durationDays: 10, rewardPercentage: 20, minAmount: 50, badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
                { name: 'Growth Tier', durationDays: 20, rewardPercentage: 40, minAmount: 100, badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
                { name: 'Pro Tier', durationDays: 30, rewardPercentage: 43.33, minAmount: 300, badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20' }
            ]);
            console.log("[STAKING] Seeded default investment pools.");
        }
    }

    // --- 3. Stake NXS (Start Investment) ---
    async stakeNXS(userId, poolId, amount) {
        if (!amount || amount <= 0) throw new Error("Invalid stake amount");

        return await TransactionHelper.runTransaction(async (session) => {
            const pool = await StakingPool.findById(poolId).session(session);
            if (!pool || !pool.isActive) throw new Error("Invalid or inactive Staking Pool");

            if (amount < pool.minAmount) {
                throw new Error(`Minimum amount for this pool is ${pool.minAmount} NXS`);
            }

            // Check specific user requirement (e.g. balance)
            const user = await User.findById(userId).session(session);
            if (!user) throw new Error("User not found");

            if (user.wallet.income < 5) {
                throw new Error("Income Wallet balance must exceed $5.00 NXS to engage in any investments.");
            }
            if (user.wallet.income < amount) {
                throw new Error(`Insufficient income balance. You have ${user.wallet.income} NXS available.`);
            }

            // Calculate exact unlock date and rewards
            const now = new Date();
            const unlocksAt = new Date(now.getTime() + (pool.durationDays * 24 * 60 * 60 * 1000));
            const expectedReward = parseFloat((amount * (pool.rewardPercentage / 100)).toFixed(6));

            // Deduct from Income, Add to staked
            const userUpd = await User.findByIdAndUpdate(userId, {
                $inc: {
                    'wallet.income': -amount,
                    'wallet.staked': amount
                }
            }, { session, new: true });

            // Create Stake Record
            const stake = await UserStake.create([{
                userId,
                poolId,
                stakedAmount: amount,
                expectedReward,
                lockedAt: now,
                unlocksAt
            }], { session, ordered: true });

            // Create Transaction Log
            await Transaction.create([{
                userId,
                amount: -amount,
                type: 'staking_deposit',
                description: `Locked NXS in ${pool.name} (${pool.durationDays} Days)`,
                source: 'system',
                status: 'completed',
                currency: 'NXS'
            }], { session, ordered: true });

            // [SOCKET] Real-time Balance Update
            try {
                const SocketService = require('../common/SocketService');
                SocketService.broadcast(`user_${userId}`, `balance_update_${userId}`, userUpd.wallet.main);
                SocketService.broadcast(`user_${userId}`, `balance_update`, userUpd.wallet);
            } catch (e) { }

            return stake[0];
        });
    }

    // --- 4. Claim Matured Stake (Get Principal + Profit) ---
    async claimStake(userId, stakeId) {
        return await TransactionHelper.runTransaction(async (session) => {
            const stake = await UserStake.findById(stakeId).populate('poolId').session(session);
            if (!stake) throw new Error("Investment record not found");
            if (stake.userId.toString() !== userId.toString()) throw new Error("Unauthorized");
            if (stake.status !== 'ACTIVE') throw new Error(`This stake is already ${stake.status}`);

            const now = new Date();
            if (now < stake.unlocksAt) {
                // Determine penalty info just to output an error
                throw new Error("This investment has not matured yet. Use Early Withdrawal if you need funds urgently.");
            }

            // Mature! Claim Principal ONLY (Profits were already paid out daily by the cron job)
            const totalToCredit = stake.stakedAmount;

            const userUpd = await User.findByIdAndUpdate(userId, {
                $inc: {
                    'wallet.staked': -stake.stakedAmount,
                    'wallet.main': totalToCredit
                }
            }, { session, new: true });

            // Mark completed
            stake.status = 'COMPLETED';
            stake.claimedAt = now;
            await stake.save({ session });

            // Build Transaction Logs
            await Transaction.create([
                {
                    userId,
                    amount: stake.stakedAmount,
                    type: 'staking_principal_return',
                    description: `Staking Principal Returned (${stake.poolId.name})`,
                    source: 'system',
                    status: 'completed',
                    currency: 'NXS'
                }
            ], { session, ordered: true });

            // [SOCKET] Real-time Balance Update
            try {
                const SocketService = require('../common/SocketService');
                SocketService.broadcast(`user_${userId}`, `balance_update_${userId}`, userUpd.wallet.main);
                SocketService.broadcast(`user_${userId}`, `balance_update`, userUpd.wallet);
            } catch (e) { }

            return stake;
        });
    }

    // --- 5. Early Withdrawal (Penalty) ---
    async earlyWithdrawal(userId, stakeId) {
        return await TransactionHelper.runTransaction(async (session) => {
            const stake = await UserStake.findById(stakeId).populate('poolId').session(session);
            if (!stake) throw new Error("Investment record not found");
            if (stake.userId.toString() !== userId.toString()) throw new Error("Unauthorized");
            if (stake.status !== 'ACTIVE') throw new Error(`This stake is already ${stake.status}`);

            const now = new Date();
            if (now >= stake.unlocksAt) {
                throw new Error("This investment has already matured. Please use the Claim button instead.");
            }

            // Early Withdrawal Penalty: 5% of principal AND forfeit all previously paid daily rewards
            const PENALTY_PERCENT = 0.05;
            const penaltyAmount = parseFloat((stake.stakedAmount * PENALTY_PERCENT).toFixed(6));
            
            const alreadyPaidOut = stake.accumulatedPaid || 0;
            // Clawback logic ensures they don't get away with free daily profit if they back out early
            const refundAmount = parseFloat((stake.stakedAmount - penaltyAmount - alreadyPaidOut).toFixed(6));
            const finalRefund = Math.max(0, refundAmount);

            const userUpd = await User.findByIdAndUpdate(userId, {
                $inc: {
                    'wallet.staked': -stake.stakedAmount,
                    'wallet.main': finalRefund 
                }
            }, { session, new: true });

            // Mark cancelled
            stake.status = 'CANCELLED';
            stake.claimedAt = now;
            await stake.save({ session });

            // Transaction Logs
            await Transaction.create([
                {
                    userId,
                    amount: refundAmount,
                    type: 'staking_early_withdrawal',
                    description: `Early Staking Withdrawal (${stake.poolId.name})`,
                    source: 'system',
                    status: 'completed',
                    currency: 'NXS'
                },
                {
                    userId,
                    amount: -penaltyAmount,
                    type: 'fee',
                    description: `Early Withdrawal Penalty FEE (5%)`,
                    source: 'system',
                    status: 'completed',
                    currency: 'NXS'
                }
            ], { session, ordered: true });

            // [SOCKET] Real-time Balance Update
            try {
                const SocketService = require('../common/SocketService');
                SocketService.broadcast(`user_${userId}`, `balance_update_${userId}`, userUpd.wallet.main);
                SocketService.broadcast(`user_${userId}`, `balance_update`, userUpd.wallet);
            } catch (e) { }

            return stake;
        });
    }

    // --- 6. Get User Stakes ---
    async getUserStakes(userId) {
        return await UserStake.find({ userId })
            .populate('poolId', 'name durationDays rewardPercentage badgeColor bgClass')
            .sort({ createdAt: -1 });
    }
}

module.exports = new StakingService();
