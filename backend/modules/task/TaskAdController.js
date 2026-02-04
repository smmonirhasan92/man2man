const TaskAd = require('./TaskAdModel');
const Plan = require('../admin/PlanModel');

exports.getTaskAds = async (req, res) => {
    try {
        const ads = await TaskAd.find().sort({ priority: -1, createdAt: -1 });
        res.json(ads);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.createTaskAd = async (req, res) => {
    try {
        const { title, url, imageUrl, duration, reward_amount, priority, type } = req.body;

        // Basic Validation
        if (!title || !url || !duration || !reward_amount) {
            return res.status(400).json({ message: 'Please fill all required fields.' });
        }

        const newAd = new TaskAd({
            title,
            url,
            imageUrl,
            duration: parseInt(duration),
            reward_amount: parseFloat(reward_amount),
            priority: parseInt(priority) || 0,
            type: type || 'ad_view',
            server_id: req.body.server_id || 'SERVER_01' // [NEW] Pass server_id
        });

        const savedAd = await newAd.save();
        res.json(savedAd);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.updateTaskAd = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const updatedAd = await TaskAd.findByIdAndUpdate(id, updates, { new: true });
        if (!updatedAd) return res.status(404).json({ message: 'Ad not found' });

        res.json(updatedAd);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deleteTaskAd = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await TaskAd.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ message: 'Ad not found' });
        res.json({ message: 'Ad Deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};
