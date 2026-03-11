const StakingService = require('./StakingService');

class StakingController {
    // --- Get Available Pools ---
    async getPools(req, res) {
        try {
            const pools = await StakingService.getAvailablePools();
            res.json(pools);
        } catch (e) {
            res.status(500).json({ message: e.message });
        }
    }

    // --- Stake NXS ---
    async stake(req, res) {
        try {
            const { poolId, amount } = req.body;
            const stake = await StakingService.stakeNXS(req.user.user.id, poolId, amount);
            res.json({ success: true, stake });
        } catch (e) {
            res.status(400).json({ message: e.message });
        }
    }

    // --- Claim Matured Stake ---
    async claim(req, res) {
        try {
            const stake = await StakingService.claimStake(req.user.user.id, req.params.id);
            res.json({ success: true, stake });
        } catch (e) {
            res.status(400).json({ message: e.message });
        }
    }

    // --- Early Withdrawal (Penalty) ---
    async earlyWithdraw(req, res) {
        try {
            const stake = await StakingService.earlyWithdrawal(req.user.user.id, req.params.id);
            res.json({ success: true, stake });
        } catch (e) {
            res.status(400).json({ message: e.message });
        }
    }

    // --- Get My Active/Completed Stakes ---
    async getMyStakes(req, res) {
        try {
            const stakes = await StakingService.getUserStakes(req.user.user.id);
            res.json(stakes);
        } catch (e) {
            res.status(500).json({ message: e.message });
        }
    }
}

module.exports = new StakingController();
