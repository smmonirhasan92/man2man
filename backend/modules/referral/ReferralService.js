const mongoose = require('mongoose');
const User = require('../user/UserModel');
const Plan = require('../admin/PlanModel');
const Transaction = require('../wallet/TransactionModel');
const SystemSetting = require('../settings/SystemSettingModel');
const NotificationService = require('../notification/NotificationService');
const { runTransaction } = require('../common/TransactionHelper');

class ReferralService {

    static get PLAN_COMMISSION_RATES() {
        // [MODIFIED] Empire Race 3-Level Split
        // Level 1: 12%, Level 2: 6%, Level 3: 2.5%
        return [12.0, 6.0, 2.5];
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
                        }], { session, ordered: true });
                    }

                    // 4. [NEW] Hand Completion Logic (Power of 5)
                    // ... (keep existing 5-ref hand logic)
                    const HAND_SIZE = 5;
                    const currentCount = directUpline.referralCount || 0;
                    
                    if (currentCount > 0 && currentCount % HAND_SIZE === 0) {
                        const milestoneValue = currentCount;
                        if (!directUpline.handMilestonesClaimed?.includes(milestoneValue)) {
                            const HAND_BONUS = 50; 
                            directUpline.referralHands = (directUpline.referralHands || 0) + 1;
                            directUpline.wallet.income += HAND_BONUS;
                            directUpline.referralIncome += HAND_BONUS;
                            if (!directUpline.handMilestonesClaimed) directUpline.handMilestonesClaimed = [];
                            directUpline.handMilestonesClaimed.push(milestoneValue);
                            await Transaction.create([{
                                userId: directUpline._id,
                                type: 'referral_commission',
                                amount: HAND_BONUS,
                                status: 'completed',
                                description: `🤚 Hand #${directUpline.referralHands} Completed! (${milestoneValue} Referrals)`,
                                metadata: { milestone: milestoneValue, handCount: directUpline.referralHands }
                            }], { session, ordered: true });
                            NotificationService.send(
                                directUpline._id, 
                                `You've completed Hand #${directUpline.referralHands}. ${HAND_BONUS} NXS bonus added!`, 
                                'success',
                                { title: "Hand Completed! 🤚" }
                            ).catch(() => {});

                            // [SOCKET] Real-time Milestone Alert
                            try {
                                const SocketService = require('../common/SocketService');
                                SocketService.emitToUser(directUpline._id, 'milestone_alert', {
                                    message: `🤚 Hand #${directUpline.referralHands} Completed!`,
                                    bonus: HAND_BONUS
                                });
                            } catch (e) { }
                        }
                    }

                    // --- [NEW] EMPIRE HAND (5x5) TRACKING ENGINE ---
                    // This logic tracks the "Fingers" of the Empire Hand.
                    // We check if the BUYER is a direct of the UPLINE.
                    let activeHand = directUpline.empireHands.find(h => h.status === 'active');
                    if (!activeHand) {
                        directUpline.empireHands.push({ handIndex: (directUpline.empireHands.length || 0) + 1, directs: [], status: 'active' });
                        activeHand = directUpline.empireHands[directUpline.empireHands.length - 1];
                    }

                    // If buyer is a direct, add them as a "Finger" if there's room
                    if (activeHand.directs.length < 5 && !activeHand.directs.find(d => d.userId.toString() === userId.toString())) {
                        activeHand.directs.push({ userId: userId, downlineCount: 0, isQualified: false });
                    }
                    // --- END EMPIRE TRACKING ---

                    await directUpline.save({ session });
                    currentUser.isReferralBonusPaid = true;
                    await currentUser.save({ session });
                }
            }

            // --- [NEW] EMPIRE RACE: PACKAGE TRACKING ---
            // Independent of one-time bonuses, we track EVERY plan purchase for the direct upline
            if (uplineCode) {
                const directUpline = await User.findOne({ referralCode: uplineCode }).session(session);
                if (directUpline) {
                    directUpline.purchaseCount = (directUpline.purchaseCount || 0) + 1;
                    directUpline.monthlyPurchases = (directUpline.monthlyPurchases || 0) + 1;
                    directUpline.lastPurchaseDate = new Date();

                    // If Plan is considered a "Big Package" (e.g. >= 5000 NXS or 50 USD)
                    // They get 1 Tour Point
                    if (planAmount >= 5000) {
                        directUpline.tourSales = (directUpline.tourSales || 0) + 1;
                        
                        // Notify Upline about Tour Progress
                        NotificationService.send(
                            directUpline._id,
                            `A direct downline purchased a premium package! Tour Sales: ${directUpline.tourSales}/20`,
                            'success',
                            { title: "Empire Tour Progress! ✈️" }
                        ).catch(() => {});
                    }

                    await directUpline.save({ session });
                }
            }
            const rates = ReferralService.PLAN_COMMISSION_RATES;
            const buyerDirectPercent = rates[0]; // L1 = 8%
            const buyerPlanObj = await Plan.findOne({ name: planName }).session(session);
            let totalDistributed = 0;

            // Loop 5 Levels
            for (let i = 0; i < rates.length; i++) {
                if (!uplineCode) break; // No more upline

                const uplineUser = await User.findOne({ referralCode: uplineCode }).session(session);
                if (!uplineUser) break; // Broken link

                let commission = 0;
                let commissionDesc = '';
                let liabilitySaved = 0;

                // --- [NEW] Level 1 Dynamic Commission (Upsell / Downsell Engine) ---
                if (i === 0 && buyerPlanObj) {
                    // Find Upline's Highest Active Plan
                    const UserPlan = require('../plan/UserPlanModel');
                    const uplinePlans = await UserPlan.find({
                        userId: uplineUser._id,
                        status: 'active',
                        expiryDate: { $gt: new Date() }
                    }).session(session);

                    let uplineHighestPlanValue = 0;
                    let uplineDirectPercent = 7.2;
                    let uplineUpsellPercent = 0.66;

                    if (uplinePlans.length > 0) {
                        // Fetch plan details to find the most expensive one they own
                        const planIds = uplinePlans.map(p => p.planId);
                        const allUplinePlans = await Plan.find({ _id: { $in: planIds } }).session(session);

                        for (const p of allUplinePlans) {
                            if (p.unlock_price > uplineHighestPlanValue) {
                                uplineHighestPlanValue = p.unlock_price;
                                uplineDirectPercent = p.direct_commission_percent;
                                uplineUpsellPercent = p.upsell_bonus_percent;
                            }
                        }
                    }

                    // The Core Engine: Check if Seller is smaller than Buyer (Upsell Scenario)
                    if (uplineHighestPlanValue > 0 && uplineHighestPlanValue < planAmount) {
                        // Seller gets capped at their own plan's default commission
                        const referrerCap = (uplineHighestPlanValue * uplineDirectPercent) / 100;
                        // Plus a tiny bonus on the excess amount
                        const excessAmount = planAmount - uplineHighestPlanValue;
                        const upsellBonus = (excessAmount * uplineUpsellPercent) / 100;

                        commission = referrerCap + upsellBonus;

                        // Calculate standard payout to find how much the platform saved
                        const theoreticalPayout = (planAmount * buyerDirectPercent) / 100;
                        liabilitySaved = Math.max(0, theoreticalPayout - commission);

                        commissionDesc = `L1 Commission (Smart Capped) from ${currentUser.username} (${planName})`;
                        console.log(`🤑 [Smart Cap] Saved Platform ${liabilitySaved.toFixed(4)} NXS on ${uplineUser.username}'s sale.`);
                    } else {
                        // Downsell or Equal Level: Full Buyer Percent
                        commission = (planAmount * buyerDirectPercent) / 100;
                        commissionDesc = `L1 Commission from ${currentUser.username} (${planName})`;
                    }
                } else {
                    // Level 2 to Level 5: Standard Percentages (1%, 1%, 0.5%, 0.5%)
                    commission = (planAmount * rates[i]) / 100;
                    commissionDesc = `L${i + 1} Commission from ${currentUser.username} (${planName})`;
                }

                // Fix precision to 4 decimals to avoid 0.00500000001
                commission = Math.round(commission * 10000) / 10000;

                if (commission > 0) {
                    // [MODIFIED] Lock Commission for 5 days instead of direct credit
                    const releaseDate = new Date();
                    releaseDate.setDate(releaseDate.getDate() + 5);

                    uplineUser.wallet.pending_referral = (uplineUser.wallet.pending_referral || 0) + commission;
                    
                    // [NEW] Track residual to Admin Reserve Fund
                    if (liabilitySaved > 0) {
                        await SystemSetting.findOneAndUpdate(
                            { key: 'admin_reserve_fund' },
                            { $inc: { value: liabilitySaved } },
                            { upsert: true }
                        );
                    }

                    // [NEW] Update level-wise stats (Keep tracking for progress)
                    if (!uplineUser.referralEarningsByLevel) uplineUser.referralEarningsByLevel = [0, 0, 0];
                    uplineUser.referralEarningsByLevel[i] = (uplineUser.referralEarningsByLevel[i] || 0) + commission;
                    uplineUser.markModified('referralEarningsByLevel');

                    await uplineUser.save({ session });

                    // Log Transaction as LOCKED
                    await Transaction.create([{
                        userId: uplineUser._id,
                        type: 'referral_commission',
                        source: 'referral',
                        amount: commission,
                        status: 'locked', // [UX PHASE]
                        description: commissionDesc,
                        metadata: {
                            sourceUser: userId,
                            level: i + 1,
                            planAmount: planAmount,
                            releaseDate: releaseDate, // For claim logic
                            liabilitySaved: liabilitySaved > 0 ? liabilitySaved : undefined
                        }
                    }], { session, ordered: true });

                    // [SOCKET] Real-time Commission Alert
                    try {
                        const SocketService = require('../common/SocketService');
                        SocketService.emitToUser(uplineUser._id, 'commission_alert', {
                            message: commissionDesc,
                            amount: commission,
                            source: currentUser.username,
                            status: 'locked'
                        });
                        // Also update wallet UI
                        SocketService.emitToUser(uplineUser._id, 'wallet_update', {
                            pending_referral: uplineUser.wallet.pending_referral
                        });
                    } catch (e) { }

                    totalDistributed += commission;
                    console.log(`   -> Locked L${i + 1} (${uplineUser.username}): ${commission} (Release: ${releaseDate.toLocaleDateString()})`);
                }

                // Move Up
                const oldUplineCode = uplineCode;
                uplineCode = uplineUser.referredBy;

                // [NEW] If next level exists in rates but no upline found, track as residual (Incomplete Lines)
                if (!uplineCode && i + 1 < rates.length) {
                    let residualSum = 0;
                    for (let j = i + 1; j < rates.length; j++) {
                        residualSum += (planAmount * rates[j]) / 100;
                    }
                    if (residualSum > 0) {
                        await SystemSetting.findOneAndUpdate(
                            { key: 'admin_reserve_fund' },
                            { $inc: { value: residualSum } },
                            { upsert: true }
                        );
                        console.log(`🏦 [Residual] Saved ${residualSum.toFixed(4)} NXS from Incomplete Line to Admin Fund.`);
                    }
                }

                // --- [NEW] EMPIRE HAND DOWNLINE PROGRESSION ---
                // If we are at Level 2-5, we check if the upline has an active Empire Hand
                // and if the "Parent" of the buyer is one of the "Fingers" of the Empire Hand.
                if (i >= 1) { // L2 to L5
                    const grandUpline = uplineUser; // The one receiving the L2+ commission
                    const activeEmpireHand = grandUpline.empireHands?.find(h => h.status === 'active');
                    if (activeEmpireHand) {
                        // We need to find which "Finger" (Direct) this buyer belongs to.
                        // For L2, the referredBy is the direct.
                        // For L3+, we'd need to trace back. For simplicity, we check if any direct of grandUpline is in the path.
                        // Let's find the direct who started this chain.
                        const buyerPath = currentUser.referredBy; 
                        // Find the direct of grandUpline who is the parent/grandparent of the buyer.
                        // This is computationally expensive to do recursively here, 
                        // so we check if the user who referred the buyer is a direct of grandUpline.
                        const finger = activeEmpireHand.directs.find(d => d.userId.toString() === currentUser.referredBy.toString());
                        if (finger && !finger.isQualified) {
                            finger.downlineCount = (finger.downlineCount || 0) + 1;
                            if (finger.downlineCount >= 5) {
                                finger.isQualified = true;
                                console.log(`🚀 Finger Qualified for ${grandUpline.username}!`);
                            }
                            
                            // Check if Hand is Matured (All 5 fingers qualified)
                            if (activeEmpireHand.directs.length === 5 && activeEmpireHand.directs.every(d => d.isQualified)) {
                                activeEmpireHand.status = 'matured';
                                activeEmpireHand.maturityDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Days Buffer
                                activeEmpireHand.bonusAmount = 1500; // Base $15
                                console.log(`🏆 EMPIRE HAND MATURED for ${grandUpline.username}! Matures on ${activeEmpireHand.maturityDate}`);
                            }
                            grandUpline.markModified('empireHands');
                            await grandUpline.save({ session });
                        }
                    }
                }
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
    static async distributeIncome(sourceUserId, referrerCode, amount, type, externalSession = null) {
        const logic = async (session) => {
            console.log(`[Referral] Distributing ${type}: ${amount} (Earned by ${sourceUserId}, Starting at ${referrerCode})`);

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
                    // [MODIFIED] Lock Task Referral Commission too
                    const releaseDate = new Date();
                    releaseDate.setDate(releaseDate.getDate() + 5);

                    uplineUser.wallet.pending_referral = (uplineUser.wallet.pending_referral || 0) + comm;
                    
                    if (!uplineUser.referralEarningsByLevel) uplineUser.referralEarningsByLevel = [0, 0, 0, 0, 0];
                    uplineUser.referralEarningsByLevel[i] = (uplineUser.referralEarningsByLevel[i] || 0) + comm;
                    uplineUser.markModified('referralEarningsByLevel');

                    await uplineUser.save({ session });

                    await Transaction.create([{
                        userId: uplineUser._id,
                        type: 'referral_commission',
                        source: 'referral',
                        amount: comm,
                        status: 'locked',
                        description: type === 'batched_daily_task_reward'
                            ? `L${i + 1} Batched Daily Task Rewards from ${sourceUserId}`
                            : `L${i + 1} Task Bonus from ${sourceUserId}`,
                        metadata: {
                            level: i + 1,
                            sourceUser: sourceUserId,
                            type: type,
                            releaseDate: releaseDate
                        }
                    }], { session, ordered: true });

                    // [SOCKET] Real-time Commission Alert
                    try {
                        const SocketService = require('../common/SocketService');
                        SocketService.emitToUser(uplineUser._id, 'commission_alert', {
                            message: `L${i + 1} Task Bonus from ${sourceUserId}`,
                            amount: comm,
                            source: sourceUserId,
                            status: 'locked'
                        });
                        // Also update wallet UI
                        SocketService.emitToUser(uplineUser._id, 'wallet_update', {
                            pending_referral: uplineUser.wallet.pending_referral
                        });
                    } catch (e) { }

                    // [REDIS] Invalidate Upline Cache
                    try {
                        const redisInv = require('../../config/redis');
                        await redisInv.client.del(`user_profile:${uplineUser._id}`);
                    } catch (e) { }

                    totalDistributed += comm;
                    console.log(`   -> Task Bonus L${i + 1} LOCKED: ${comm} to ${uplineUser.username}`);
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
