/**
 * REFERRAL RENEWAL COMMISSION FIX
 * ==========================================
 * Changes:
 * 1. ReferralService.js:
 *    - Add RENEWAL_COMMISSION_RATES: L1=1.5%, L2=2.5%, L3/L4/L5=0 (FIXED)
 *    - distributePlanCommission() now accepts isRenewal flag
 *    - Renewal: only 2 levels, no smart cap, no random
 *    - First purchase: fix Math.random() → fixed 10%
 *
 * 2. PlanService.js:
 *    - Count existing UserPlans BEFORE commission call
 *    - If count >= 2 → isRenewal = true (the new plan was just inserted)
 *    - Pass isRenewal to distributePlanCommission()
 *
 * SAFETY: No DB changes, no data deletion, backward compatible.
 */

const fs = require('fs');

const REFERRAL_FILE = '/var/www/man2man/backend/modules/referral/ReferralService.js';
const PLAN_FILE     = '/var/www/man2man/backend/modules/plan/PlanService.js';

// ─── Backup ───────────────────────────────────────────────────────────────────
fs.copyFileSync(REFERRAL_FILE, REFERRAL_FILE + '.bak2');
fs.copyFileSync(PLAN_FILE,     PLAN_FILE     + '.bak2');
console.log('✅ Backups created (.bak2)');

// ═══════════════════════════════════════════════════════════════════════════════
// FIX 1: ReferralService.js
// ═══════════════════════════════════════════════════════════════════════════════
let referralContent = fs.readFileSync(REFERRAL_FILE, 'utf8');

// ── 1A: Add RENEWAL_COMMISSION_RATES constant after TASK_LOAN_RATES ────────────
const OLD_TASK_RATES = `    static get TASK_LOAN_RATES() {
        // [NEW] Task & Loan: 5 Levels (Total 6%)
        // Split: 2%, 1%, 1%, 1%, 1%
        return [2.0, 1.0, 1.0, 1.0, 1.0];
    }`;

const NEW_TASK_RATES = `    static get TASK_LOAN_RATES() {
        // [NEW] Task & Loan: 5 Levels (Total 6%)
        // Split: 2%, 1%, 1%, 1%, 1%
        return [2.0, 1.0, 1.0, 1.0, 1.0];
    }

    static get RENEWAL_COMMISSION_RATES() {
        // [POLICY] 2nd Month+ Package Renewal: Fixed 2 levels only
        // L1=1.5%, L2=2.5%, L3/L4/L5=0 — NO RANDOM, NO SMART CAP
        return [1.5, 2.5];
    }`;

if (!referralContent.includes(OLD_TASK_RATES)) {
    console.error('ABORT: TASK_LOAN_RATES block not found in ReferralService.js');
    process.exit(1);
}
referralContent = referralContent.replace(OLD_TASK_RATES, NEW_TASK_RATES);
console.log('✅ Step 1A: RENEWAL_COMMISSION_RATES added');

// ── 1B: Fix distributePlanCommission signature → add isRenewal param ────────────
const OLD_SIGNATURE = 'static async distributePlanCommission(userId, planAmount, planName, externalSession = null) {';
const NEW_SIGNATURE = 'static async distributePlanCommission(userId, planAmount, planName, externalSession = null, isRenewal = false) {';

if (!referralContent.includes(OLD_SIGNATURE)) {
    console.error('ABORT: distributePlanCommission signature not found');
    process.exit(1);
}
referralContent = referralContent.replace(OLD_SIGNATURE, NEW_SIGNATURE);
console.log('✅ Step 1B: isRenewal parameter added to distributePlanCommission()');

// ── 1C: Fix Math.random() → Fixed 10% for first purchase ──────────────────────
const OLD_RANDOM = `            const rates = ReferralService.PLAN_COMMISSION_RATES;
            // [MODIFIED] Randomize L1 fast referral bonus between 9% and 12%
            const buyerDirectPercent = 9.0 + (Math.random() * 3.0); // 9% to 12%`;

const NEW_RANDOM = `            // [POLICY] Select commission rates based on purchase type
            const rates = isRenewal
                ? ReferralService.RENEWAL_COMMISSION_RATES   // L1=1.5%, L2=2.5% only
                : ReferralService.PLAN_COMMISSION_RATES;     // Full 3-level rates

            // [FIX] Removed Math.random() — fixed 10% for first purchase L1 downsell
            const buyerDirectPercent = 10.0; // Fixed — no random

            // [POLICY] Renewal: skip smart cap, distribute at fixed rates directly
            if (isRenewal) {
                let totalRenewalDist = 0;
                let uplineCodeR = uplineCode;
                for (let r = 0; r < ReferralService.RENEWAL_COMMISSION_RATES.length; r++) {
                    if (!uplineCodeR) break;
                    const uplineR = await User.findOne({ referralCode: uplineCodeR }).session(session);
                    if (!uplineR) break;

                    const renewalPercent = ReferralService.RENEWAL_COMMISSION_RATES[r];
                    const renewalComm = Math.round((planAmount * renewalPercent / 100) * 10000) / 10000;

                    if (renewalComm > 0) {
                        uplineR.wallet.income = (uplineR.wallet.income || 0) + renewalComm;
                        uplineR.referralIncome = (uplineR.referralIncome || 0) + renewalComm;
                        if (!uplineR.referralEarningsByLevel) uplineR.referralEarningsByLevel = [0, 0, 0, 0, 0];
                        uplineR.referralEarningsByLevel[r] = (uplineR.referralEarningsByLevel[r] || 0) + renewalComm;
                        uplineR.markModified('referralEarningsByLevel');
                        await uplineR.save({ session });

                        await Transaction.create([{
                            userId: uplineR._id,
                            type: 'referral_commission',
                            source: 'referral',
                            amount: renewalComm,
                            status: 'completed',
                            description: \`L\${r + 1} Renewal Commission from \${currentUser.username} (\${planName})\`,
                            metadata: { sourceUser: userId, level: r + 1, planAmount, isRenewal: true }
                        }], { session, ordered: true });

                        try {
                            const SocketService = require('../common/SocketService');
                            SocketService.emitToUser(uplineR._id, 'commission_alert', {
                                message: \`L\${r + 1} Renewal Commission from \${currentUser.username}\`,
                                amount: renewalComm, source: currentUser.username, status: 'completed'
                            });
                            SocketService.emitToUser(uplineR._id, 'wallet_update', { income: uplineR.wallet.income });
                        } catch (e) {}

                        totalRenewalDist += renewalComm;
                        console.log(\`   -> Renewal L\${r + 1} (\${uplineR.username}): \${renewalComm} NXS (\${renewalPercent}%)\`);
                    }
                    uplineCodeR = uplineR.referredBy;
                }
                console.log(\`[Referral] Renewal commission complete. Total: \${totalRenewalDist} NXS\`);
                return { success: true, distributed: totalRenewalDist };
            }`;

if (!referralContent.includes(OLD_RANDOM)) {
    console.error('ABORT: rates/Math.random block not found in ReferralService.js');
    console.error('Searching for partial match...');
    const idx = referralContent.indexOf('Math.random()');
    if (idx > -1) console.error('Math.random() found at char', idx, ':', referralContent.substring(idx - 50, idx + 100));
    process.exit(1);
}
referralContent = referralContent.replace(OLD_RANDOM, NEW_RANDOM);
console.log('✅ Step 1C: Math.random() removed, renewal dispatch logic added');

// ── 1D: Write updated ReferralService.js ──────────────────────────────────────
fs.writeFileSync(REFERRAL_FILE, referralContent, 'utf8');
console.log('✅ ReferralService.js saved to VPS');

// ── Verify ReferralService.js ──────────────────────────────────────────────────
const verifyReferral = fs.readFileSync(REFERRAL_FILE, 'utf8');
if (verifyReferral.includes('Math.random()')) {
    console.error('❌ FAIL: Math.random() still present in ReferralService.js!');
    process.exit(1);
}
if (!verifyReferral.includes('RENEWAL_COMMISSION_RATES')) {
    console.error('❌ FAIL: RENEWAL_COMMISSION_RATES not found!');
    process.exit(1);
}
if (!verifyReferral.includes('isRenewal = false')) {
    console.error('❌ FAIL: isRenewal param not found!');
    process.exit(1);
}
console.log('✅ ReferralService.js verification PASSED');

// ═══════════════════════════════════════════════════════════════════════════════
// FIX 2: PlanService.js — detect renewal & pass flag
// ═══════════════════════════════════════════════════════════════════════════════
let planContent = fs.readFileSync(PLAN_FILE, 'utf8');

const OLD_COMMISSION_CALL = `            if (plan.type !== 'vip' && !user.is_loan_active && (!user.wallet || !user.wallet.loan_due || user.wallet.loan_due <= 0)) {
                // Emit Pure NXS Pricing to Referral System (1:1 ecosystem compatibility)
                await this.ReferralService.distributePlanCommission(user._id, plan.unlock_price, plan.name, session);`;

const NEW_COMMISSION_CALL = `            if (plan.type !== 'vip' && !user.is_loan_active && (!user.wallet || !user.wallet.loan_due || user.wallet.loan_due <= 0)) {
                // [POLICY] Detect if this is a renewal purchase (user already had >= 1 plan before this one)
                // UserPlan was just created above, so count >= 2 means renewal
                const existingPlanCount = await UserPlan.countDocuments({ userId: user._id }).session(session);
                const isRenewal = existingPlanCount >= 2;
                console.log(\`[PlanService] Commission type: \${isRenewal ? 'RENEWAL' : 'FIRST PURCHASE'} (plans count: \${existingPlanCount})\`);

                // Emit Pure NXS Pricing to Referral System (1:1 ecosystem compatibility)
                await this.ReferralService.distributePlanCommission(user._id, plan.unlock_price, plan.name, session, isRenewal);`;

if (!planContent.includes(OLD_COMMISSION_CALL)) {
    console.error('ABORT: Commission call block not found in PlanService.js');
    process.exit(1);
}
planContent = planContent.replace(OLD_COMMISSION_CALL, NEW_COMMISSION_CALL);
fs.writeFileSync(PLAN_FILE, planContent, 'utf8');
console.log('✅ PlanService.js: isRenewal detection added');

// ── Verify PlanService.js ──────────────────────────────────────────────────────
const verifyPlan = fs.readFileSync(PLAN_FILE, 'utf8');
if (!verifyPlan.includes('isRenewal')) {
    console.error('❌ FAIL: isRenewal not found in PlanService.js!');
    process.exit(1);
}
console.log('✅ PlanService.js verification PASSED');

// ═══════════════════════════════════════════════════════════════════════════════
console.log('');
console.log('🎉 ALL CHANGES APPLIED & VERIFIED');
console.log('');
console.log('   FIRST PURCHASE:  L1=10% (fixed), L2=6%, L3=2.5% (Smart Cap active)');
console.log('   RENEWAL (2nd+):  L1=1.5% (fixed), L2=2.5% (fixed), L3/L4/L5=0%');
console.log('   TASK COMMISSION: Unchanged');
console.log('   Math.random():   REMOVED from referral system');
console.log('');
console.log('NEXT: docker compose build backend && up -d backend');
