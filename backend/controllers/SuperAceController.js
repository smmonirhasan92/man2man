const SuperAceService = require('../modules/game/SuperAceService');

exports.spin = async (req, res) => {
    try {
        const { betAmount } = req.body;
        const result = await SuperAceService.spin(req.user.user.id, parseFloat(betAmount));
        res.json(result);
    } catch (e) {
        console.error("Super Ace Error:", e);
        res.status(400).json({ message: e.message || 'Spin Failed' });
    }
};
