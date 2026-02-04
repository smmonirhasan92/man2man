const SupportMessage = require('../modules/support/SupportMessageModel');
const { User } = require('../modules/user/UserModel');

// Send Message (User)
exports.sendMessage = async (req, res) => {
    try {
        const { subject, message } = req.body;
        const userId = req.user.user.id;

        const newMessage = await SupportMessage.create({
            userId,
            subject,
            message,
            status: 'pending'
        });

        res.status(201).json({ message: 'Message sent successfully', support: newMessage });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get User Messages (User History)
exports.getUserMessages = async (req, res) => {
    try {
        const userId = req.user.user.id;
        const messages = await SupportMessage.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']]
        });
        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Reply to Message (Admin)
exports.replyToMessage = async (req, res) => {
    try {
        const { messageId, reply } = req.body;

        const supportMessage = await SupportMessage.findByPk(messageId);
        if (!supportMessage) {
            return res.status(404).json({ message: 'Message not found' });
        }

        supportMessage.adminReply = reply;
        supportMessage.status = 'replied';
        await supportMessage.save();

        res.json({ message: 'Reply sent successfully', support: supportMessage });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get All Messages (Admin)
exports.getAllMessages = async (req, res) => {
    try {
        const messages = await SupportMessage.findAll({
            include: [{ model: User, attributes: ['fullName', 'phone'] }],
            order: [['createdAt', 'DESC']]
        });
        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};
