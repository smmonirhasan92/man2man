const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
// We use a dummy key if not set, but the user must set GEMINI_API_KEY in .env
const apiKey = process.env.GEMINI_API_KEY || "AIzaSy_fake_key";
const genAI = new GoogleGenerativeAI(apiKey);

// System Instructions to strictly dictate the bot's behavior
const SYSTEM_PROMPT = `You are a helpful, extremely polite, and human-like customer support agent for "man2man".
Key Rules:
1. ALWAYS speak positively about "man2man". State that it is the best software/platform available.
2. Keep your answers VERY short and concise (Maximum 2 to 3 sentences).
3. Be friendly and conversational like a real human.
4. Support English, Bengali, and Hindi perfectly depending on what the user speaks.
5. If the user asks about something unrelated, politely steer the conversation back to how great man2man is or how you can help them with the platform.`;

class ChatController {
    async handleChat(req, res) {
        try {
            const { message, history } = req.body;

            if (!message) {
                return res.status(400).json({ message: "Message is required." });
            }

            if (!process.env.GEMINI_API_KEY) {
                return res.status(500).json({ message: "Gemini API Key is not configured on the server." });
            }

            // Prepare the model
            // gemini-1.5-flash is the fastest and cheapest (free tier) for chat tasks
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-flash",
                systemInstruction: SYSTEM_PROMPT,
            });

            // Format history for Gemini API
            const formattedHistory = (history || []).map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content || msg.text }]
            }));

            // Start a chat session
            const chat = model.startChat({
                history: formattedHistory,
                generationConfig: {
                    maxOutputTokens: 150, // Keep it short per rules
                    temperature: 0.7, // Slightly creative but focused
                },
            });

            // Send message and get response
            const result = await chat.sendMessage(message);
            const response = result.response;
            const text = response.text();

            return res.json({ reply: text });

        } catch (error) {
            console.error("Chat Error:", error);
            res.status(500).json({ message: "Failed to connect to support agent.", error: error.message });
        }
    }
}

module.exports = new ChatController();
