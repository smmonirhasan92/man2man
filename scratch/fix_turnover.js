const fs = require('fs');
const path = '/var/www/man2man/backend/modules/wallet/TurnoverService.js';

const newContent = `const User = require('../user/UserModel');

class TurnoverService {

    // 1. ADD REQUIREMENT (Deposit or Win)
    static async addRequirement(userId, amount, multiplier = 1, session = null) {
        if (!amount || amount <= 0) return;
        const requirement = amount * multiplier;
        const opts = session ? { session } : {};
        await User.findByIdAndUpdate(userId, {
            $inc: { 'wallet.turnover.required': requirement }
        }, opts);
        console.log('[TURNOVER] User ' + userId + ': Added ' + requirement + ' to Requirement');
    }

    // 2. RECORD PROGRESS (Bet)
    static async recordBet(userId, betAmount, session = null) {
        if (!betAmount || betAmount <= 0) return;
        const opts = session ? { session } : {};
        await User.findByIdAndUpdate(userId, {
            $inc: { 'wallet.turnover.completed': betAmount }
        }, opts);
    }

    // 3. CHECK ELIGIBILITY (Withdrawal)
    // [v8.0 POLICY UPDATE] Turnover gate DISABLED by platform decision.
    // Users can withdraw freely without game play requirement.
    static async checkWithdrawalEligibility(userId, session = null) {
        return { allowed: true, stats: { required: 0, completed: 0, remaining: 0 } };
    }
}

module.exports = TurnoverService;
`;

fs.writeFileSync(path, newContent, 'utf8');
console.log('[FIX] TurnoverService updated - withdrawal gate DISABLED');
console.log('[FIX] File written to:', path);
console.log('[FIX] New content preview:');
console.log(fs.readFileSync(path, 'utf8').substring(0, 200));
