const SystemSetting = require('./SystemSettingModel');

// Get Public Settings (safe for frontend)
// Get Public Settings (safe for frontend)
exports.getPublicSettings = async (req, res) => {
    try {
        const defaults = {
            site_name: 'USA Affiliate',
            currency_symbol: 'NXS',
            usd_to_bdt_rate: 110,
            maintenance_mode: false
        };

        // Fetch all relevant settings
        const settingsDocs = await SystemSetting.find({
            key: { $in: ['site_name', 'currency_symbol', 'usd_to_bdt_rate', 'maintenance_mode'] }
        });

        // Reduce to object
        const dbSettings = settingsDocs.reduce((acc, doc) => {
            acc[doc.key] = doc.value;
            return acc;
        }, {});

        // Merge defaults with DB values (DB takes precedence)
        const finalSettings = { ...defaults, ...dbSettings };

        res.json(finalSettings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Update Settings (Admin Only) - Placeholder for now
exports.updateSettings = async (req, res) => {
    // ... Logic to update
    res.json({ message: 'Settings updated' });
};
