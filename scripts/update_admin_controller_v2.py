
import os

file_path = '/var/www/man2man/backend/modules/admin/AdminController.js'
with open(file_path, 'r') as f:
    content = f.read()

new_methods = """
    /**
     * [v2.4] Get Users with Empire Activity (Shares/Hold Balance)
     * GET /api/admin/empire/users
     */
    async getEmpireUsers(req, res) {
        try {
            const User = require('../user/UserModel');
            const users = await User.find({
                $or: [
                    { 'referralEmpire.sharesCount': { $gt: 0 } },
                    { 'referralEmpire.holdBalance': { $gt: 0 } }
                ]
            })
            .select('username fullName referralEmpire referralCount wallet.income')
            .sort({ 'referralEmpire.holdBalance': -1 });

            return res.json({ success: true, users });
        } catch (e) {
            return res.status(500).json({ message: e.message });
        }
    }

    /**
     * [v2.4] Release Empire Hold Balance to User Income Wallet
     * POST /api/admin/empire/release
     */
    async releaseEmpireBonus(req, res) {
        try {
            const User = require('../user/UserModel');
            const Transaction = require('../transaction/TransactionModel');
            const { userId } = req.body;

            const user = await User.findById(userId);
            if (!user) return res.status(404).json({ message: "User not found" });

            const amount = user.referralEmpire?.holdBalance || 0;
            if (amount <= 0) return res.status(400).json({ message: "No hold balance to release" });

            // Atomic update: Transfer balance
            user.wallet.income += amount;
            user.referralIncome += amount;
            user.referralEmpire.holdBalance = 0;
            
            await user.save();

            // Create Audit Transaction
            await Transaction.create({
                userId: user._id,
                type: 'referral_commission',
                amount: amount,
                status: 'completed',
                description: 'Admin Release: Empire Milestone Bonus',
                source: 'admin'
            });

            // Notify User via Socket
            try {
                const SocketService = require('../common/SocketService');
                SocketService.emitToUser(user._id, 'bonus_release', {
                    message: `Your Empire Bonus of ${amount} NXS has been released!`,
                    amount: amount
                });
            } catch (err) {}

            return res.json({ success: true, message: `Successfully released ${amount} NXS to ${user.username}` });
        } catch (e) {
            return res.status(500).json({ message: e.message });
        }
    }
"""

if 'getEmpireUsers' not in content:
    target = 'module.exports = new AdminController();'
    new_content = content.replace(target, new_methods + "\n" + target)
    with open(file_path, 'w') as f:
        f.write(new_content)
    print("Successfully added Empire management methods to AdminController.")
else:
    print("Methods already exist.")
