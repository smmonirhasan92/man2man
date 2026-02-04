const Banner = require('./BannerModel');

exports.getBanners = async (req, res) => {
    try {
        const banners = await Banner.find({ isActive: true }).sort({ order: 1 });
        res.json(banners);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createBanner = async (req, res) => {
    try {
        // Simple creation, assumes Image Upload is handled elsewhere or URL provided
        const banner = new Banner(req.body);
        await banner.save();
        res.status(201).json(banner);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.deleteBanner = async (req, res) => {
    try {
        await Banner.findByIdAndDelete(req.params.id);
        res.json({ message: 'Banner deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
