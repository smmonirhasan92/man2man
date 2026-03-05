const mongoose = require('mongoose');
const User = require('../user/UserModel');
const Transaction = require('../wallet/TransactionModel');
const SystemSetting = require('../settings/SystemSettingModel');
const NotificationService = require('../notification/NotificationService');
const { runTransaction } = require('../common/TransactionHelper');

class ReferralService {

    static get PLAN_COMMISSION_RATES() {
        // [MODIFIED] 5-Level Split (Total 5%)
        // Level 1: 2%, Level 2: 1%, Level 3: 1%, Level 4: 0.5%, Level 5: 0.5%
        return [2.0, 1.0, 1.0, 0.5, 0.5];
    }

    /**
     * Distribute Plan Purchase Commission (5 Levels)
     * Triggered when a user calls PlanService.purchasePlan()
     * Supports externalSession for Atomic Transactions.
     */
    static async distributePlanCommission(userId, planAmount, planName, externalSession = null) {
        const commissionLogic = async (session) => {
            console.log(`[Referral] Distributing Plan Commission for User: ${userId}, Amount: ${planAmount}`);

            const currentUser = await User.findById(userId).session(session);
            let uplineCode = currentUser.referredBy;

            // --- [NEW] ONE-TIME FIXED REFERRAL BONUS & PROMOTIONAL TIER UPGRADES ---
            if (uplineCode && !currentUser.isReferralBonusPaid) {
                const directUpline = await User.findOne({ referralCode: uplineCode }).session(session);
                if (directUpline) {
                    // 1. Activate referral count (User officially bought a plan)
                    directUpline.referralCount = (directUpline.referralCount || 0) + 1;

                    // 2. Fetch Global Settings for Bonuses & Tiers
                    const sysSettings = await SystemSetting.find({
                        key: { $in: ['referral_bonus_amount', 'referral_tiers', 'referral_reward_currency'] }
                    }).session(session);

                    const getSet = (key, def) => {
                        const s = sysSettings.find(s => s.key === key);
                        return s ? s.value : def;
                    };

                    const bonusAmount = parseFloat(getSet('referral_bonus_amount', '0'));
                    const rewardCurrency = getSet('referral_reward_currency', 'income') || 'income';

                    // 3. Payout Fixed Per-Invite Bonus
                    if (bonusAmount > 0) {
                        directUpline.wallet[rewardCurrency] = (directUpline.wallet[rewardCurrency] || 0) + bonusAmount;
                        if (rewardCurrency === 'income') directUpline.referralIncome = (directUpline.referralIncome || 0) + bonusAmount;

                        await Transaction.create([{
                            userId: directUpline._id,
                            type: 'referral_commission',
                            amount: bonusAmount,
                            status: 'completed',
                            description: `Fixed Referral Bonus from ${currentUser.username}`,
                            metadata: { sourceUser: userId }
                        }], { session });
                    }

                    // 4. Check & Award Promotional Tier Upgrades
                    try {
                        let tiers = JSON.parse(getSet('referral_tiers', '[]'));
                        if (Array.isArray(tiers) && tiers.length > 0) {
                            for (const tier of tiers) {
                                // If they EXACTLY hit the target, award the tier bonus once
                                if (directUpline.referralCount === tier.targetReferrals && tier.bonusAmount > 0) {
                                    // Promotional Tier bonuses go to the Main Wallet as per requirement
                                    directUpline.wallet.main = (directUpline.wallet.main || 0) + tier.bonusAmount;

                                    // Mark as Promoted for Admin visibility
                                    if (directUpline.taskData) directUpline.taskData.promotionalStatus = 'promoted';

                                    await Transaction.create([{
                                        userId: directUpline._id,
                                        type: 'referral_commission',
                                        amount: tier.bonusAmount,
                                        status: 'completed',
                                        description: `🏆 ${tier.name} Tier Promotion Bonus!`,
                                        metadata: { tierName: tier.name, target: tier.targetReferrals }
                                    }], { session });

                                    console.log(`🚀 Tier Upgrade: ${directUpline.username} achieved ${tier.name}! Awarded ৳${tier.bonusAmount}`);
                                }
                            }
                        }
                    } catch (e) {
                        console.error('Invalid referral_tiers JSON in DB', e);
                    }

                    await directUpline.save({ session });
                    currentUser.isReferralBonusPaid = true;
                    await currentUser.save({ session });
                    console.log(`[Referral] User ${currentUser.username} officially counted. Direct Upline active referrals: ${directUpline.referralCount}`);
                }
            }
            // -------------------------------------------------------------------------

            const rates = ReferralService.PLAN_COMMISSION_RATES;
            let totalDistributed = 0;

            // Loop 5 Levels
            for (let i = 0; i < rates.length; i++) {
                if (!uplineCode) break; // No more upline

                const uplineUser = await User.findOne({ referralCode: uplineCode }).session(session);
                if (!uplineUser) break; // Broken link

                // Calculate Commission (Safe Rounding)
                let commission = (planAmount * rates[i]) / 100;
                // Fix precision to 4 decimals to avoid 0.00500000001
                commission = Math.round(commission * 10000) / 10000;

                if (commission > 0) {
                    // Credit INCOME WALLET directly (Module C Requirement)
                    uplineUser.wallet.income = (uplineUser.wallet.income || 0) + commission;
                    uplineUser.referralIncome = (uplineUser.referralIncome || 0) + commission;
                    await uplineUser.save({ session });

                    // Log Transaction
                    await Transaction.create([{
                        userId: uplineUser._id,
                        type: 'referral_commission',
                        amount: commission,
                        status: 'completed',
                        description: `L${i + 1} Commission from ${currentUser.username} (${planName})`,
                        metadata: {
                            sourceUser: userId,
                            level: i + 1,
                            planAmount: planAmount
                        }
                    }], { session });

                    // Notify
                    /* NotificationService.send(
                        uplineUser._id,
                        `You earned $${commission.toFixed(4)} (Level ${i + 1}) from ${currentUser.username}'s purchase!`,
                        'success'
                    ); */

                    totalDistributed += commission;
                    console.log(`   -> Credited L${i + 1} (${uplineUser.username}): ${commission}`);
                }

                // Move Up
                uplineCode = uplineUser.referredBy;
            }

            return { success: true, distributed: totalDistributed };
        };

        if (externalSession) {
            return await commissionLogic(externalSession);
        } else {
            return await runTransaction(commissionLogic);
        }
    }

    /**
     * Distribute Generic Income (Task, etc)
     * Now follows the same 5-level structure (5% total pool)
     */
    static async distributeIncome(referrerCode, amount, type, externalSession = null) {
        const logic = async (session) => {
            console.log(`[Referral] Distributing ${type}: ${amount} (Starting at ${referrerCode})`);

            if (!referrerCode || amount <= 0) return { success: true, distributed: 0 };

            // [MODIFIED] Use same 5-Level Rates for Tasks
            const rates = ReferralService.PLAN_COMMISSION_RATES;
            let uplineCode = referrerCode;
            let totalDistributed = 0;

            for (let i = 0; i < rates.length; i++) {
                if (!uplineCode) break;

                const uplineUser = await User.findOne({ referralCode: uplineCode }).session(session);
                if (!uplineUser) break;

                let comm = (amount * rates[i]) / 100;
                // Fix precision to 4 decimals
                comm = Math.round(comm * 10000) / 10000;

                if (comm > 0) {
                    uplineUser.wallet.income = (uplineUser.wallet.income || 0) + comm;
                    uplineUser.referralIncome = (uplineUser.referralIncome || 0) + comm;
                    await uplineUser.save({ session });

                    await Transaction.create([{
                        userId: uplineUser._id,
                        type: 'referral_commission',
                        amount: comm,
                        status: 'completed',
                        description: `L${i + 1} Task Bonus`,
                        metadata: { level: i + 1 }
                    }], { session });

                    // [REDIS] Invalidate Upline Cache
                    try {
                        const redisInv = require('../../config/redis');
                        await redisInv.client.del(`user_profile:${uplineUser._id}`);
                    } catch (e) { }

                    totalDistributed += comm;
                    console.log(`   -> Task Bonus L${i + 1}: ${comm} to ${uplineUser.username}`);
                }
                uplineCode = uplineUser.referredBy;
            }
            return { success: true, distributed: totalDistributed };
        };

        if (externalSession) return await logic(externalSession);
        return await runTransaction(logic);
    }
}

module.exports = ReferralService;
