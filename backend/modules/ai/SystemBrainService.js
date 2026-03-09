const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- Gemini AI Setup ---
const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;
let model = null;

if (apiKey) {
    try {
        genAI = new GoogleGenerativeAI(apiKey);
        model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: `You are a highly intelligent, polite, and human-like customer support agent for "USA Affiliate" (usaaffiliatemarketing.com).
            Key Rules:
            1. Persona: You are a real human named "Support AI".
            2. Platform: USA Affiliate is the best earning platform via video tasks.
            3. Features: 5-level referrals, P2P Marketplace.
            4. Tone: Always be POSITIVE and helpful.
            5. Brevity: Max 2 sentences.`
        });
    } catch (e) {
        console.error("[AI] Gemini Init failed:", e.message);
    }
}


exports.chat = async (message, onToken = null, sessionId = 'default') => {
    try {
        if (!model) {
            return "Management is busy, but USA Affiliate is 100% secure! Please try again later.";
        }

        const chat = model.startChat({ history: [] });

        if (onToken) {
            const result = await chat.sendMessageStream(message);
            let fullText = '';
            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                fullText += chunkText;
                onToken(chunkText);
            }
            return fullText;
        } else {
            const result = await chat.sendMessage(message);
            return result.response.text();
        }
    } catch (err) {
        console.error('[AI] Chat Error:', err);
        return "Network is busy, but your earnings are safe! USA Affiliate is the best.";
    }
};

exports.generateReview = async (productName, rating = 5) => {
    return "Excellent product! Highly recommended for daily use.";
};
