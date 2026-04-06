const GameVault = require('./GameVaultModel');
const RedisService = require('../../services/RedisService');

/**
 * Public Vault Controller (Safe Metrics Only)
 */
exports.getPublicVaultStatus = async (req, res) => {
    try {
        const vault = await GameVault.getMasterVault();
        if (!vault) return res.status(404).json({ success: false, message: 'Vault not found' });

        // FETCH LIVE POT FROM REDIS INSTEAD OF MONGO
        let redisLivePot = await RedisService.get('livedata:game:match_pot');
        const pool = redisLivePot !== null ? parseFloat(redisLivePot) : vault.balances.activePool;
        const hardStop = vault.config.hardStopLimit || 1000;
        
        // Safety Strategy: Max payout is either 5% of the pool OR the hard stop, whichever is smaller.
        // This ensures the game never collapses on a single hit.
        const maxSafeWin = Math.min(hardStop, Math.max(1, pool * 0.05));

        return res.json({
            success: true,
            maxSafeWin: parseFloat(maxSafeWin.toFixed(2)),
            currency: 'NXS',
            poolSize: parseFloat(pool.toFixed(2))
        });
    } catch (err) {
        console.error("[VAULT_STATUS_ERROR]", err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
