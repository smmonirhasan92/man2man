const SystemBrain = require('../modules/ai/SystemBrainService');

class ChatController {
    async handleChat(req, res) {
        try {
            const { message, history } = req.body;

            if (!message) {
                return res.status(400).json({ message: "Message is required." });
            }

            // Using unified Local AI Brain from SystemBrainService
            // Pass the first user interaction as sessionId for history tracking if wanted
            const reply = await SystemBrain.chat(message, null, req.ip);

            return res.json({ reply });

        } catch (error) {
            console.error("Chat Error:", error);
            res.status(500).json({ message: "Failed to connect to support agent.", error: error.message });
        }
    }
}

module.exports = new ChatController();
