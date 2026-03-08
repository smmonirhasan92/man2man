const SupportMessage = require('../modules/support/SupportMessageModel');
const { User } = require('../modules/user/UserModel');

// Create New Ticket (User)
exports.sendMessage = async (req, res) => {
    try {
        const { subject, message } = req.body;
        const userId = req.user.user.id; // From middleware

        const newTicket = await SupportMessage.create({
            userId,
            subject,
            messages: [{
                senderId: userId,
                senderRole: 'user',
                text: message
            }],
            status: 'open'
        });

        res.status(201).json({ message: 'Ticket created successfully', support: newTicket });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Admin Initiate Ticket
exports.adminInitiateTicket = async (req, res) => {
    try {
        const { targetUserId, message } = req.body;
        const adminId = req.user.user.id; // From middleware

        const newTicket = await SupportMessage.create({
            userId: targetUserId,
            subject: 'Support team message',
            messages: [{
                senderId: adminId,
                senderRole: 'admin',
                text: message
            }],
            status: 'answered'
        });

        const populated = await newTicket.populate('userId', 'fullName email phone');
        res.status(201).json({ message: 'Message sent to user', support: populated });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get User Tickets (User History)
exports.getUserMessages = async (req, res) => {
    try {
        const userId = req.user.user.id;
        const tickets = await SupportMessage.find({ userId }).sort({ createdAt: -1 });
        res.json(tickets);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Reply to Ticket (Admin & User)
exports.replyToMessage = async (req, res) => {
    try {
        const { messageId, reply } = req.body;

        // Detect sender from middleware if possible, else determine role
        const senderId = req.user?.user?._id || req.user?.user?.id;
        const role = req.user?.user?.role;
        const isUser = (role === 'user');

        const ticket = await SupportMessage.findById(messageId);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        ticket.messages.push({
            senderId,
            senderRole: isUser ? 'user' : 'admin',
            text: reply
        });

        // Toggle Status mapping
        ticket.status = isUser ? 'open' : 'answered';

        await ticket.save();

        res.json({ message: 'Reply sent successfully', support: ticket });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get All Tickets (Admin)
exports.getAllMessages = async (req, res) => {
    try {
        const tickets = await SupportMessage.find()
            .populate('userId', 'fullName phone')
            .sort({ createdAt: -1 });
        res.json(tickets);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};
