const mongoose = require('mongoose');
const User = require('../user/UserModel');
const Plan = require('../admin/PlanModel');
const Transaction = require('../wallet/TransactionModel');
const SystemSetting = require('../settings/SystemSettingModel');
const NotificationService = require('../notification/NotificationService');
const { runTransaction } = require('../common/TransactionHelper');

class ReferralService {

    static get PLAN_COMMISSION_RATES() {
        // [MODIFIED] Standard Node Plans: 3 Levels (12%, 6%, 2.5%)
        return [12.0, 6.0, 2.5];
    }

    static get TASK_LOAN_RATES() {
        // [NEW] Task & Loan: 5 Levels (Total 6%)
        // Split: 2%, 1%, 1%, 1%, 1%
        return [2.0, 1.0, 1.0, 1.0, 1.0];
    }

    /**
     * Distribute Plan Purchase Commission (5 Levels)
     * Triggered when a user calls PlanService.purchasePlan()
     * Supports externalSession for Atomic Transactions.
     */
    static getTierRates(tier, isFirstPurchase) {
        // Returns percentages for [L1, L2, L3]
        if (tier === 'Platinum' || tier === 'Diamond') {
            return isFirstPurchase ? [12.0, 6.0, 2.5] : [5.0, 2.0, 1.0];
        } else if (tier === 'Gold') {
            return isFirstPurchase ? [8.0, 3.0, 0.0] : [3.0, 1.0, 0.0];
        } else {
            // Silver or Starter
            return isFirstPurchase ? [5.0, 0.0, 0.0] : [1.0, 0.0, 0.0];
        }
    }

    /**
     * Distribute Plan Purchase Commission (3 Levels max for Plans)
     * Card-based Matrix & 2-Level Firewall for Empire Tracking
     */
    static async distributePlanCommission(userId, planAmount, planName, externalSession = null) {
        const commissionLogic = async (session) => {
            console.log(`[Referral] Distributing Plan Commission for User: ${userId}, Amount: ${planAmount}`);

            const currentUser = await User.findById(userId).session(session);
            const UserPlan = require('../plan/UserPlanModel');
            
            // Determine if this is the BUYER's first purchase
            const userPlanCount = await UserPlan.countDocuments({ userId: currentUser._id }).session(session);
            const isFirstPurchase = userPlanCount <= 1; // newly created plan is counted, so <= 1 means first.

            let uplineCode = currentUser.referredBy;
            let totalDistributed = 0;

            // Track Empire conditions
            const isGoldStandard = planAmount >= 1500; // $15+
            const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

            for (let i = 0; i < 3; i++) {
                if (!uplineCode) break;

                const uplineUser = await User.findOne({ referralCode: uplineCode }).session(session);
                if (!uplineUser) break;

                // 1. Calculate Card-Based Commission
                const uplineTier = uplineUser.taskData?.accountTier || 'Starter';
                const currentRates = ReferralService.getTierRates(uplineTier, isFirstPurchase);
                const commissionPercent = currentRates[i];
                let commission = 0;

                if (commissionPercent > 0) {
                    commission = (planAmount * commissionPercent) / 100;
                    commission = Math.round(commission * 10000) / 10000;

                    uplineUser.wallet.income = (uplineUser.wallet.income || 0) + commission;
                    uplineUser.referralIncome = (uplineUser.referralIncome || 0) + commission;

                    if (!uplineUser.referralEarningsByLevel) uplineUser.referralEarningsByLevel = [0, 0, 0, 0, 0];
                    uplineUser.referralEarningsByLevel[i] = (uplineUser.referralEarningsByLevel[i] || 0) + commission;

                    const desc = isFirstPurchase 
                        ? `L${i + 1} Acquisition Bonus from ${currentUser.username} (${uplineTier} Tier)`
                        : `L${i + 1} Renewal Bonus from ${currentUser.username} (${uplineTier} Tier)`;

                    await Transaction.create([{
                        userId: uplineUser._id,
                        type: 'referral_commission',
                        source: 'referral',
                        amount: commission,
                        status: 'completed',
                        description: desc,
                        metadata: { sourceUser: userId, level: i + 1, planAmount, isFirstPurchase }
                    }], { session, ordered: true });
                    
                    totalDistributed += commission;
                    
                    try {
                        const SocketService = require('../common/SocketService');
                        SocketService.emitToUser(uplineUser._id, 'commission_alert', {
                            message: desc, amount: commission, source: currentUser.username, status: 'completed'
                        });
                        SocketService.emitToUser(uplineUser._id, 'wallet_update', { income: uplineUser.wallet.income });
                    } catch (e) { }
                }

                // 2. Admin Reserve Fund (Residual liability saved)
                const maxPossiblePercent = isFirstPurchase ? [12.0, 6.0, 2.5][i] : [5.0, 2.0, 1.0][i];
                const liabilitySavedPercent = maxPossiblePercent - commissionPercent;
                if (liabilitySavedPercent > 0) {
                    const savedAmt = (planAmount * liabilitySavedPercent) / 100;
                    await SystemSetting.findOneAndUpdate(
                        { key: 'admin_reserve_fund' },
                        { $inc: { value: savedAmt } },
                        { upsert: true, session }
                    );
                }

                // --- 3. 2-LEVEL FIREWALL EMPIRE TRACKING ---
                if (isGoldStandard) {
                    // Initialize objects if missing
                    if (!uplineUser.monthlySprint) uplineUser.monthlySprint = { currentMonth: '', directsCount: 0, volume: 0, bonusClaimed: false };
                    if (!uplineUser.directEmpire) uplineUser.directEmpire = { goldMembers: [], totalCount: 0, isMatured: false };
                    if (!uplineUser.teamEmpire) uplineUser.teamEmpire = { completedTeams: 0, currentTeamMembers: [] };

                    // Level 1: Directs (Monthly Sprint + Lifetime Direct + Team Empire)
                    if (i === 0) {
                        // A. Monthly Sprint
                        if (uplineUser.monthlySprint.currentMonth !== currentMonth) {
                            uplineUser.monthlySprint.currentMonth = currentMonth;
                            uplineUser.monthlySprint.directsCount = 0;
                            uplineUser.monthlySprint.volume = 0;
                            uplineUser.monthlySprint.bonusClaimed = false;
                        }
                        
                        // Prevent duplicate counting for the same user in the same month sprint
                        // We track volume, but counting "directsCount" should only happen once per user per sprint.
                        // For simplicity and since we track purchases, each $15+ purchase increments volume.
                        uplineUser.monthlySprint.directsCount += 1; 
                        uplineUser.monthlySprint.volume += planAmount;

                        if (uplineUser.monthlySprint.directsCount >= 5 && !uplineUser.monthlySprint.bonusClaimed) {
                            const sprintBonus = (uplineUser.monthlySprint.volume * 5) / 100; // 5% Volume Bonus
                            uplineUser.wallet.income += sprintBonus;
                            uplineUser.monthlySprint.bonusClaimed = true;
                            
                            await Transaction.create([{
                                userId: uplineUser._id,
                                type: 'referral_commission',
                                amount: sprintBonus,
                                status: 'completed',
                                description: `🏆 Monthly Sprint Bonus (5 Directs!)`
                            }], { session, ordered: true });
                        }

                        // B. Lifetime Direct Empire
                        if (!uplineUser.directEmpire.isMatured) {
                            if (!uplineUser.directEmpire.goldMembers.includes(currentUser._id)) {
                                uplineUser.directEmpire.goldMembers.push(currentUser._id);
                                uplineUser.directEmpire.totalCount += 1;
                                
                                if (uplineUser.directEmpire.totalCount >= 20) {
                                    uplineUser.directEmpire.isMatured = true;
                                }
                            }
                        }
                        
                        // C. Team Empire Point
                        if (!uplineUser.teamEmpire.currentTeamMembers.includes(currentUser._id)) {
                            uplineUser.teamEmpire.currentTeamMembers.push(currentUser._id);
                            
                            if (uplineUser.teamEmpire.currentTeamMembers.length >= 25) {
                                uplineUser.teamEmpire.completedTeams += 1;
                                uplineUser.teamEmpire.currentTeamMembers = []; 
                                uplineUser.wallet.income += 3000; 
                                
                                await Transaction.create([{
                                    userId: uplineUser._id,
                                    type: 'referral_commission',
                                    amount: 3000,
                                    status: 'completed',
                                    description: `👑 Team Empire Completed! (25 Members)`
                                }], { session, ordered: true });
                            }
                        }
                    } 
                    // Level 2: Team Empire Point for Grand Upline (2-Level Firewall)
                    else if (i === 1) {
                        if (!uplineUser.teamEmpire.currentTeamMembers.includes(currentUser._id)) {
                            uplineUser.teamEmpire.currentTeamMembers.push(currentUser._id);
                            
                            if (uplineUser.teamEmpire.currentTeamMembers.length >= 25) {
                                uplineUser.teamEmpire.completedTeams += 1;
                                uplineUser.teamEmpire.currentTeamMembers = []; 
                                uplineUser.wallet.income += 3000; 
                                
                                await Transaction.create([{
                                    userId: uplineUser._id,
                                    type: 'referral_commission',
                                    amount: 3000,
                                    status: 'completed',
                                    description: `👑 Team Empire Completed! (25 Members)`
                                }], { session, ordered: true });
                            }
                        }
                    }
                    // Level 3+ does NOT get Empire tracking (Firewall block)
                }

                uplineUser.markModified('monthlySprint');
                uplineUser.markModified('directEmpire');
                uplineUser.markModified('teamEmpire');
                await uplineUser.save({ session });
                
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
    static async distributeIncome(sourceUserId, referrerCode, amount, type, externalSession = null) {
        const logic = async (session) => {
            console.log(`[Referral] Distributing ${type}: ${amount} (Earned by ${sourceUserId}, Starting at ${referrerCode})`);

            if (!referrerCode || amount <= 0) return { success: true, distributed: 0 };

            // [MODIFIED] Use NEW 5-Level Rates (6% Total)
            const rates = ReferralService.TASK_LOAN_RATES;
            let uplineCode = referrerCode;
            let totalDistributed = 0;

            for (let i = 0; i < rates.length; i++) {
                if (!uplineCode) break;

                const uplineUser = await User.findOne({ referralCode: uplineCode }).session(session);
                if (!uplineUser) break;

                // Self-referral check: prevent circular earnings
                if (uplineUser._id.toString() === sourceUserId.toString()) break;

                let comm = (amount * rates[i]) / 100;
                // Fix precision to 4 decimals
                comm = Math.round(comm * 10000) / 10000;

                if (comm > 0) {
                    // [UX PHASE] 20-Referral Empire Progress (Big Packages / Tour Sales)
                    const empireGoal = 20;
                    const empireProgress = Math.min(uplineUser.tourSales || 0, empireGoal);
                    const empirePercentage = (empireProgress / empireGoal) * 100;

                    // Task Referral Commissions are NO LONGER LOCKED.
                    // They are instantly credited because they are only triggered when ALL daily tasks are complete.
                    uplineUser.wallet.income = (uplineUser.wallet.income || 0) + comm;
                    
                    if (!uplineUser.referralEarningsByLevel) uplineUser.referralEarningsByLevel = [0, 0, 0, 0, 0];
                    uplineUser.referralEarningsByLevel[i] = (uplineUser.referralEarningsByLevel[i] || 0) + comm;
                    uplineUser.markModified('referralEarningsByLevel');

                    await uplineUser.save({ session });

                    await Transaction.create([{
                        userId: uplineUser._id,
                        type: 'referral_commission',
                        source: 'referral',
                        amount: comm,
                        status: 'completed', // Instantly available
                        description: type === 'batched_daily_task_reward'
                            ? `L${i + 1} Batched Daily Task Rewards from ${sourceUserId}`
                            : `L${i + 1} Task Bonus from ${sourceUserId}`,
                        metadata: {
                            level: i + 1,
                            sourceUser: sourceUserId,
                            type: type
                        }
                    }], { session, ordered: true });

                    // [SOCKET] Real-time Commission Alert
                    try {
                        const SocketService = require('../common/SocketService');
                        SocketService.emitToUser(uplineUser._id, 'commission_alert', {
                            message: `L${i + 1} Task Bonus from ${sourceUserId}`,
                            amount: comm,
                            source: sourceUserId,
                            status: 'completed'
                        });
                        // Also update wallet UI
                        SocketService.emitToUser(uplineUser._id, 'wallet_update', {
                            income: uplineUser.wallet.income
                        });
                    } catch (e) { }

                    // [REDIS] Invalidate Upline Cache
                    try {
                        const redisInv = require('../../config/redis');
                        await redisInv.client.del(`user_profile:${uplineUser._id}`);
                    } catch (e) { }

                    totalDistributed += comm;
                    console.log(`   -> Task Bonus L${i + 1} COMPLETED: ${comm} to ${uplineUser.username}`);
                }
                uplineCode = uplineUser.referredBy;

                // [NEW] If next level exists but no upline found, track as residual for Admin
                if (!uplineCode && i + 1 < rates.length) {
                    let residualSum = 0;
                    for (let j = i + 1; j < rates.length; j++) {
                        residualSum += (amount * rates[j]) / 100;
                    }
                    if (residualSum > 0) {
                        await SystemSetting.findOneAndUpdate(
                            { key: 'admin_reserve_fund' },
                            { $inc: { value: residualSum } },
                            { upsert: true }
                        );
                        console.log(`🏦 [Residual Task] Saved ${residualSum.toFixed(4)} NXS to Admin Fund.`);
                    }
                    break; 
                }
            }
            return { success: true, distributed: totalDistributed };
        };

        if (externalSession) return await logic(externalSession);
        return await runTransaction(logic);
    }

    /**
     * Distribute Loan Commission (6% Pool)
     * Triggered when a user takes a loan.
     */
    static async distributeLoanCommission(userId, loanAmount, externalSession = null) {
        const logic = async (session) => {
            const user = await User.findById(userId).session(session);
            if (!user || !user.referredBy) return { success: true };

            console.log(`[Referral] Distributing Loan Commission for ${user.username}: ${loanAmount}`);
            
            const rates = ReferralService.TASK_LOAN_RATES; // 6% split across 5 levels
            let uplineCode = user.referredBy;

            for (let i = 0; i < rates.length; i++) {
                if (!uplineCode) break;
                const upline = await User.findOne({ referralCode: uplineCode }).session(session);
                if (!upline) break;

                let comm = (loanAmount * rates[i]) / 100;
                comm = Math.round(comm * 10000) / 10000;

                if (comm > 0) {
                    upline.wallet.income += comm; // Loan commission is instant
                    upline.referralIncome += comm;
                    await upline.save({ session });

                    await Transaction.create([{
                        userId: upline._id,
                        type: 'referral_commission',
                        amount: comm,
                        status: 'completed',
                        description: `L${i + 1} Loan Commission from ${user.username}`,
                        metadata: { sourceUser: userId, level: i + 1 }
                    }], { session });
                }
                uplineCode = upline.referredBy;

                // [NEW] If next level exists but no upline found, track as residual for Admin
                if (!uplineCode && i + 1 < rates.length) {
                    let residualSum = 0;
                    for (let j = i + 1; j < rates.length; j++) {
                        residualSum += (loanAmount * rates[j]) / 100;
                    }
                    if (residualSum > 0) {
                        await SystemSetting.findOneAndUpdate(
                            { key: 'admin_reserve_fund' },
                            { $inc: { value: residualSum } },
                            { upsert: true }
                        );
                        console.log(`🏦 [Residual Loan] Saved ${residualSum.toFixed(4)} NXS to Admin Fund.`);
                    }
                    break;
                }
            }
            return { success: true };
        };

        if (externalSession) return await logic(externalSession);
        return await runTransaction(logic);
    }
}

module.exports = ReferralService;
