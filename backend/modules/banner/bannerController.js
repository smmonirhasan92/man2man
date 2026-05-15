const Banner = require('./BannerModel');

// Public: Get all active banners sorted by order
exports.getBanners = async (req, res) => {
    try {
        const banners = await Banner.find({ isActive: true }).sort({ order: 1 });
        res.json(banners);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Admin: Create banner
exports.createBanner = async (req, res) => {
    try {
        const banner = new Banner(req.body);
        await banner.save();
        res.status(201).json(banner);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Admin: Update banner
exports.updateBanner = async (req, res) => {
    try {
        const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!banner) return res.status(404).json({ error: 'Banner not found' });
        res.json(banner);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Admin: Delete banner
exports.deleteBanner = async (req, res) => {
    try {
        await Banner.findByIdAndDelete(req.params.id);
        res.json({ message: 'Banner deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Admin: Toggle active/inactive
exports.toggleBanner = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) return res.status(404).json({ error: 'Banner not found' });
        banner.isActive = !banner.isActive;
        await banner.save();
        res.json(banner);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
