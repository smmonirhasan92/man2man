const HistoryLogService = require('../modules/history/HistoryLogService');

exports.getHistory = async (req, res) => {
    try {
        const { type, limit } = req.query;
        const history = await HistoryLogService.getLedger(req.user.user.id, { type, limit });
        res.json(history);
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: "Failed to fetch history" });
    }
};
