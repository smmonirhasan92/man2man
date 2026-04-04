const SystemSetting = require('./SystemSettingModel');

// Get Public Settings (safe for frontend)
// Get Public Settings (safe for frontend)
exports.getPublicSettings = async (req, res) => {
    try {
        const defaults = {
            site_name: 'USA Affiliate',
            currency_symbol: 'NXS',
            maintenance_mode: false
        };

        // Fetch all relevant settings
        const settingsDocs = await SystemSetting.find({
            key: { $in: ['site_name', 'currency_symbol', 'maintenance_mode'] }
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

// Update Settings (Admin Only)
exports.updateSettings = async (req, res) => {
    try {
        const { key, value, category, description } = req.body;
        
        if (!key || value === undefined) {
            return res.status(400).json({ success: false, message: 'Key and Value are required' });
        }

        const setting = await SystemSetting.findOneAndUpdate(
            { key },
            { 
                key, 
                value, 
                category: category || 'system',
                description 
            },
            { upsert: true, new: true }
        );

        res.json({ success: true, message: `Setting '${key}' updated successfully.`, data: setting });
    } catch (err) {
        console.error('UpdateSettings Error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
