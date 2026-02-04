const SystemSetting = require('../modules/settings/SystemSettingModel');

exports.getPublicSettings = async (req, res) => {
    try {
        // Fetch specific public keys
        const keys = ['usd_to_bdt_rate', 'site_name', 'support_link'];
        const settings = await SystemSetting.find({ key: { $in: keys }, category: 'global' });

        const config = {
            usd_to_bdt_rate: 122.50, // Fallback default
            site_name: 'USA Afiliat',
            support_link: ''
        };

        settings.forEach(s => {
            if (s.value) config[s.key] = s.value;
        });

        res.json(config);
    } catch (err) {
        console.error("Public Settings Error:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};
