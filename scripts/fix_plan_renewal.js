/**
 * Fix PlanService.js — Add isRenewal detection to commission call
 */
const fs = require('fs');
const FILE = '/var/www/man2man/backend/modules/plan/PlanService.js';

let c = fs.readFileSync(FILE, 'utf8');

// The exact string to find (line 224-226 on VPS)
const OLD = `            if (plan.type !== 'vip' && !user.is_loan_active && (!user.wallet || !user.wallet.loan_due || user.wallet.loan_due <= 0)) {
                // Emit Pure NXS Pricing to Referral System (1:1 ecosystem compatibility)
                await this.ReferralService.distributePlanCommission(user._id, plan.unlock_price, plan.name, session);`;

const NEW = `            if (plan.type !== 'vip' && !user.is_loan_active && (!user.wallet || !user.wallet.loan_due || user.wallet.loan_due <= 0)) {
                // [POLICY] Renewal detection: UserPlan already created above, count >= 2 = renewal
                const existingPlanCount = await UserPlan.countDocuments({ userId: user._id }).session(session);
                const isRenewal = existingPlanCount >= 2;
                console.log(\`[PlanService] Commission type: \${isRenewal ? 'RENEWAL (L1=1.5%, L2=2.5%)' : 'FIRST PURCHASE (Smart Cap)'} — plans: \${existingPlanCount}\`);
                await this.ReferralService.distributePlanCommission(user._id, plan.unlock_price, plan.name, session, isRenewal);`;

if (c.includes(OLD)) {
    c = c.replace(OLD, NEW);
    fs.writeFileSync(FILE, c, 'utf8');

    // Verify
    const verify = fs.readFileSync(FILE, 'utf8');
    if (verify.includes('isRenewal') && verify.includes('existingPlanCount')) {
        console.log('SUCCESS: PlanService.js isRenewal logic added and verified');
    } else {
        console.log('FAIL: Verification failed after write');
        process.exit(1);
    }
} else {
    console.log('BLOCK NOT FOUND in PlanService.js');
    // Show what's around line 224 for debugging
    const lines = c.split('\n');
    for (let i = 220; i < 230; i++) {
        console.log(`${i+1}: ${lines[i]}`);
    }
    process.exit(1);
}
