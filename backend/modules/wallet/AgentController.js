const AgentService = require('./AgentService');
const Logger = require('../common/Logger');

class AgentController {

    /**
     * Agent Deposits to User
     * POST /api/agent/deposit
     */
    async depositToUser(req, res) {
        try {
            const { userId, amount, pin } = req.body; // PIN check optional
            const agentId = req.user._id;

            if (req.user.role !== 'agent') {
                return res.status(403).json({ message: "Agent access only" });
            }

            const txn = await AgentService.processDeposit(agentId, userId, parseFloat(amount));
            return res.json({ success: true, message: "Deposit Successful", txn });

        } catch (err) {
            Logger.error("[AGENT_CTRL] Deposit Failed", err);
            return res.status(400).json({ message: err.message });
        }
    }

    /**
     * Agent Accepts Withdrawal
     * POST /api/agent/withdraw/approve
     */
    async approveWithdrawal(req, res) {
        try {
            const { transactionId } = req.body;
            const agentId = req.user._id;

            if (req.user.role !== 'agent') {
                return res.status(403).json({ message: "Agent access only" });
            }

            const txn = await AgentService.acceptWithdrawal(agentId, transactionId);

            // Optional: Notify User via Socket
            if (req.io) {
                req.io.to(txn.userId.toString()).emit('wallet:update', {
                    type: 'withdrawal_completed',
                    amount: txn.amount
                });
            }

            return res.json({ success: true, message: "Withdrawal Accepted", txn });

        } catch (err) {
            Logger.error("[AGENT_CTRL] Withdraw Approval Failed", err);
            return res.status(400).json({ message: err.message });
        }
    }
}

module.exports = new AgentController();
