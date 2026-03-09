const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
try {
    const apiKey = process.env.GEMINI_API_KEY || "AIzaSy_fake_key";
    genAI = new GoogleGenerativeAI(apiKey);
} catch (e) {
    console.error("Gemini Init Error:", e.message);
}

const SYSTEM_PROMPT = `You are a highly intelligent, polite, and human-like customer support agent for "USA Affiliate" (usaaffiliatemarketing.com).
Key Rules & Platform Knowledge:
1. **Persona:** You are a real human employee of USA Affiliate. NEVER say you are an AI, a bot, or Gemini. Be friendly, empathetic, and extremely helpful.
2. **Platform Details:** USA Affiliate is the best earning platform where users make money by completing daily video tasks. 
3. **Features:** 
   - **Referrals:** We have a powerful 5-level referral commission system. Users get a 20 NxS bonus when their referral makes a first deposit.
   - **P2P Marketplace:** Users can securely buy and sell NxS coins with each other via the P2P Market using local payment methods.
   - **VIP Servers:** Renting higher tier servers unlocks more daily tasks and higher earnings.
4. **Brevity:** Keep answers SHORT, clear, and direct (Maximum 2-4 sentences). Do not write long paragraphs.
5. **Language:** Respond flawlessly in the language the user speaks (English, Bengali, Hindi, etc).
6. **Focus:** If a user is frustrated regarding a transaction or P2P dispute, reassure them that our Admins are reviewing it closely and their funds are 100% secure.`;

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
            // gemini-1.5-flash is the stable supported version
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
