const User = require('../modules/user/UserModel');
const SystemSetting = require('../modules/settings/SystemSettingModel');

exports.getFinancialStats = async (req, res) => {
    try {
        res.json({
            totalBets: 0,
            totalPayouts: 0,
            vaultBalance: 0,
            netProfit: 0,
            vaultTotalIn: 0
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error fetching stats' });
    }
};

exports.getLockedUsers = async (req, res) => {
    try {
        const users = await User.find({
            $expr: { $gt: ["$wallet.turnoverRequired", "$wallet.turnoverCurrent"] }
        })
            .select('username wallet.turnoverRequired wallet.turnoverCurrent wallet.game')
            .limit(50);

        const formatted = users.map(u => ({
            id: u._id,
            username: u.username,
            required: u.wallet.turnoverRequired || 0,
            current: u.wallet.turnoverCurrent || 0,
            remaining: (u.wallet.turnoverRequired || 0) - (u.wallet.turnoverCurrent || 0),
            progress: u.wallet.turnoverRequired > 0 ? ((u.wallet.turnoverCurrent / u.wallet.turnoverRequired) * 100).toFixed(1) : "0.0"
        }));

        res.json(formatted);

    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error fetching locked users' });
    }
};

exports.getWarRoomSettings = async (req, res) => {
    try {
        const keys = ['global_profit_margin', 'bonus_vault_percent', 'turnover_multiplier', 'targeted_winner_id'];
        const settings = await SystemSetting.find({ key: { $in: keys } });

        const config = {
            global_profit_margin: 25,
            bonus_vault_percent: 5,
            turnover_multiplier: 20,
            targeted_winner_id: ''
        };

        settings.forEach(s => config[s.key] = s.value);
        res.json(config);

    } catch (e) {
        res.status(500).json({ message: 'Error fetching settings' });
    }
};

exports.updateWarRoomSettings = async (req, res) => {
    try {
        const { global_profit_margin, bonus_vault_percent, turnover_multiplier, targeted_winner_id } = req.body;

        await upsertSetting('global_profit_margin', global_profit_margin);
        await upsertSetting('bonus_vault_percent', bonus_vault_percent);
        await upsertSetting('turnover_multiplier', turnover_multiplier);
        await upsertSetting('targeted_winner_id', targeted_winner_id);

        res.json({ message: 'Settings Updated Successfully' });

    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Update failed' });
    }
};

async function upsertSetting(key, value) {
    if (value === undefined) return;
    await SystemSetting.findOneAndUpdate(
        { key },
        { value, category: 'game' },
        { upsert: true, new: true }
    );
}
