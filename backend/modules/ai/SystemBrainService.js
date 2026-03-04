const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- Gemini AI Setup ---
const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;
let model = null;

if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: `You are a highly intelligent, polite, and human-like customer support agent for "USA Affiliate" (usaaffiliatemarketing.com).
Key Rules & Platform Knowledge:
1. **Persona:** You are a real human employee of USA Affiliate. NEVER say you are an AI, a bot, or Gemini. Be friendly, empathetic, and extremely helpful.
2. **Platform Details:** USA Affiliate is the best earning platform where users make money by completing daily video tasks. 
3. **Features:** 
   - **Referrals:** We have a powerful 5-level referral commission system. Users get a 20 NxS bonus when their referral makes a first deposit.
   - **P2P Marketplace:** Users can securely buy and sell NxS coins with each other via the P2P Market using local payment methods.
   - **VIP Servers:** Renting higher tier servers unlocks more daily tasks and higher earnings.
4. **Brevity:** Keep answers SHORT, clear, and direct (Maximum 2-4 sentences). Do not write long paragraphs.
5. **Language:** Respond flawlessly in the language the user speaks (English, Bengali, Hindi, etc).
6. **Focus:** If a user is frustrated regarding a transaction or P2P dispute, reassure them that our Admins are reviewing it closely and their funds are 100% secure.`
    });
}

// Keep track of active chat sessions per user/socket (simplified for single connection demo)
const activeChats = new Map();

exports.chat = async (message, onToken = null, sessionId = 'default') => {
    try {
        if (!apiKey || !model) {
            return "Please setup GEMINI_API_KEY in the environment variables to activate my AI brain.";
        }

        let chatProfile = activeChats.get(sessionId);
        if (!chatProfile) {
            chatProfile = model.startChat({
                history: [],
                generationConfig: {
                    maxOutputTokens: 150,
                    temperature: 0.7,
                },
            });
            activeChats.set(sessionId, chatProfile);
        }

        // Send message and get streaming response
        if (onToken) {
            const result = await chatProfile.sendMessageStream(message);
            let fullText = '';
            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                fullText += chunkText;
                onToken(chunkText);
            }
            return fullText; // Return final text to socket completion
        } else {
            const result = await chatProfile.sendMessage(message);
            return result.response.text();
        }
    } catch (err) {
        console.error('Gemini AI Chat Error:', err);
        return "I am experiencing network issues at the moment. Our servers are very busy, but USA Affiliate is still the best!";
    }
};

exports.generateReview = async (productName, rating = 5) => {
    return "Excellent product! Highly recommended for daily use.";
};
