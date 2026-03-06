const Notification = require('./NotificationModel');

exports.getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.user.id;
        const { limit = 20 } = req.query;

        // Fetch recent notifications
        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json(notifications);
    } catch (err) {
        console.error("Get Notifications Error:", err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const userId = req.user.user.id;
        await Notification.updateMany({ userId, isRead: false }, { isRead: true });
        res.json({ message: 'Marked as read' });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const NotificationService = require('./NotificationService');

exports.sendTestOTP = async (req, res) => {
    try {
        const userId = req.user.user.id;
        const code = Math.floor(100000 + Math.random() * 900000);

        await NotificationService.send(
            userId,
            `Your Verification Code: ${code}. Do not share this with anyone.`,
            'warning'
        );

        res.json({ message: 'OTP Sent to Inbox', code });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.subscribePush = async (req, res) => {
    try {
        const userId = req.user.user.id;
        const subscription = req.body;

        const User = require('../user/UserModel');
        const user = await User.findById(userId);

        if (user) {
            if (!user.pushSubscriptions) user.pushSubscriptions = [];
            // Remove existing duplicate endpoint
            user.pushSubscriptions = user.pushSubscriptions.filter(s => s.endpoint !== subscription.endpoint);
            user.pushSubscriptions.push(subscription);
            await user.save();
            return res.status(201).json({ message: "Subscribed successfully." });
        }
        res.status(404).json({ error: "User not found" });
    } catch (err) {
        console.error("Push Subscription Error", err);
        res.status(500).json({ error: "Server error" });
    }
};
