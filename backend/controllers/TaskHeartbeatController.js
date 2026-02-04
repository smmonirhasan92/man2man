const TaskService = require('../modules/task/TaskService');

exports.heartbeat = async (req, res) => {
    try {
        const { taskId } = req.body;
        const userId = req.user.id || (req.user.user && req.user.user.id);

        const result = await TaskService.verifyHeartbeat(userId, taskId);

        if (!result.success) {
            return res.status(400).json({ success: false, message: result.message });
        }

        res.json({ success: true, timestamp: Date.now() });
    } catch (error) {
        console.error('Heartbeat Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
