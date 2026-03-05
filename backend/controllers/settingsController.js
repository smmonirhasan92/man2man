const SystemSetting = require('../modules/settings/SystemSettingModel');

// Helper to get/set methods
const getVal = async (key) => {
    const s = await SystemSetting.findOne({ key });
    return s ? s.value : null;
};
const setVal = async (key, value, description) => {
    await SystemSetting.findOneAndUpdate(
        { key },
        { value: String(value), description },
        { upsert: true, new: true }
    );
};

// Get Payment Settings
exports.getPaymentSettings = async (req, res) => {
    try {
        const bkash_number = await getVal('bkash_number');
        const bank_details = await getVal('bank_details');
        const deposit_agents_str = await getVal('deposit_agents');
        const deposit_agents = deposit_agents_str ? JSON.parse(deposit_agents_str) : [];

        res.json({
            bkash_number: bkash_number || '',
            bank_details: bank_details || '',
            deposit_agents
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Update Payment Settings
exports.updatePaymentSettings = async (req, res) => {
    try {
        const { bkash_number, bank_details } = req.body;

        if (bkash_number) await setVal('bkash_number', bkash_number, 'Admin Bkash Number');
        if (bank_details) await setVal('bank_details', bank_details, 'Bank Account Details');

        if (req.body.deposit_agents) {
            let agentsValue = req.body.deposit_agents;
            if (typeof agentsValue === 'object') agentsValue = JSON.stringify(agentsValue);
            await setVal('deposit_agents', agentsValue, 'List of Agent Numbers for Deposit');
        }

        res.json({ message: 'Settings updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Global Settings (Mapped to SystemSettings keys)
exports.getGlobalSettings = async (req, res) => {
    try {
        const keys = [
            'referral_bonus_percent', 'referral_bonus_amount',
            'silver_requirement', 'gold_requirement',
            'task_base_reward', 'daily_task_limit',
            'cash_out_commission_percent',
            'usd_to_bdt_rate', 'usd_to_inr_rate',
            'p2p_market_min', 'p2p_market_max',
            'referral_tiers', // [NEW] Dynamic JSON Array for Promotional Tiers
            // [GAME LOGIC SETTINGS]
            'house_edge', 'min_bet', 'max_bet', 'streak_threshold', 'streak_multiplier',
            'global_profit_margin', 'game_status'
        ];

        const settings = {};
        for (const key of keys) {
            settings[key] = await getVal(key);
        }

        // Defaults if missing (to match legacy behavior)
        if (!settings.task_base_reward) settings.task_base_reward = 5.00;
        if (!settings.daily_task_limit) settings.daily_task_limit = 10;
        if (!settings.p2p_market_min) settings.p2p_market_min = 120;
        if (!settings.p2p_market_max) settings.p2p_market_max = 135;
        if (!settings.usd_to_bdt_rate) settings.usd_to_bdt_rate = 126;
        if (!settings.usd_to_inr_rate) settings.usd_to_inr_rate = 89;

        // Default Referral Tiers if none exist
        if (!settings.referral_tiers) {
            settings.referral_tiers = JSON.stringify([
                { level: 1, name: "Silver", targetReferrals: 50, bonusAmount: 5 },
                { level: 2, name: "Gold", targetReferrals: 100, bonusAmount: 15 }
            ]);
        }

        res.json(settings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.updateGlobalSettings = async (req, res) => {
    try {
        const fields = [
            'referral_bonus_percent', 'referral_bonus_amount',
            'silver_requirement', 'gold_requirement',
            'task_base_reward', 'daily_task_limit',
            'cash_out_commission_percent',
            'usd_to_bdt_rate', 'usd_to_inr_rate',
            'p2p_market_min', 'p2p_market_max',
            'referral_tiers', // [NEW] Dynamic JSON Array for Promotional Tiers
            // [GAME LOGIC SETTINGS]
            'house_edge', 'min_bet', 'max_bet', 'streak_threshold', 'streak_multiplier',
            'global_profit_margin', 'game_status'
        ];

        for (const key of fields) {
            if (req.body[key] !== undefined) {
                let valueToSave = req.body[key];
                if (key === 'referral_tiers' && typeof valueToSave === 'object') {
                    valueToSave = JSON.stringify(valueToSave);
                }
                await setVal(key, valueToSave);
            }
        }
        res.json({ message: 'Global Settings Updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getPublicSettings = async (req, res) => {
    try {
        const usd_to_bdt_rate = await getVal('usd_to_bdt_rate') || 126;
        const usd_to_inr_rate = await getVal('usd_to_inr_rate') || 89;
        const p2p_market_min = await getVal('p2p_market_min') || 120;
        const p2p_market_max = await getVal('p2p_market_max') || 135;

        res.json({
            usd_to_bdt_rate: parseFloat(usd_to_bdt_rate),
            usd_to_inr_rate: parseFloat(usd_to_inr_rate),
            p2p_market_min: parseFloat(p2p_market_min),
            p2p_market_max: parseFloat(p2p_market_max)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};
