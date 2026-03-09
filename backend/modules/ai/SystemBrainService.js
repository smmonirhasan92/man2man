const path = require('path');
const { LlamaModel, LlamaContext, LlamaChatSession, LlamaChatHistory } = require('node-llama-cpp');

// --- Local AI Setup (Free & Unlimited) ---
let model = null;
let context = null;

try {
    const modelPath = path.resolve(__dirname, '../../models/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf');
    model = new LlamaModel({
        modelPath: modelPath
    });
    context = new LlamaContext({ model });
    console.log("[AI] Local TinyLlama Brain Loaded Successfully.");
} catch (e) {
    console.error("[AI] Failed to load local model:", e.message);
}

// System Prompt for a strictly positive, helpful human persona
const SYSTEM_PROMPT = `You are a highly intelligent, polite, and human - like customer support agent for "USA Affiliate"(usaaffiliatemarketing.com).
Key Rules & Platform Knowledge:
    1. ** Persona:** You are a real human employee of USA Affiliate named "Support AI".NEVER say you are an AI, a bot, or a large language model.Be friendly, empathetic, and extremely helpful.
2. ** Platform Details:** USA Affiliate is the best earning platform where users make money by completing daily video tasks. 
3. ** Features:** 
   - ** Referrals:** We have a powerful 5 - level referral commission system.Users get a 20 NxS bonus when their referral makes a first deposit.
   - ** P2P Marketplace:** Users can securely buy and sell NxS coins with each other via the P2P Market using local payment methods.
   - ** VIP Servers:** Renting higher tier servers unlocks more daily tasks and higher earnings.
4. ** Brevity:** Keep answers SHORT, clear, and direct(Maximum 2 - 3 sentences).
5. ** Language:** Respond in the language the user speaks(English, Bengali, Hindi, etc).
6. ** Focus:** Always be POSITIVE about USA Affiliate.If a user is frustrated, reassure them that their funds are 100 % secure.`;

// Keep track of active chat sessions per user/socket
const activeChats = new Map();

exports.chat = async (message, onToken = null, sessionId = 'default') => {
    try {
        if (!model || !context) {
            return "My local brain is loading, Sir. Please try again in a moment.";
        }

        let session = activeChats.get(sessionId);
        if (!session) {
            session = new LlamaChatSession({
                context: context,
                systemPrompt: SYSTEM_PROMPT
            });
            activeChats.set(sessionId, session);
        }

        if (onToken) {
            // Streaming mode for Socket.io
            const response = await session.prompt(message, {
                onToken: (tokens) => {
                    const chunk = tokens.map(t => context.model.detokenize([t])).join('');
                    onToken(chunk);
                }
            });
            return response;
        } else {
            // Standard mode for REST
            const response = await session.prompt(message);
            return response;
        }
    } catch (err) {
        console.error('[AI] Local Chat Error:', err);
        return "I am experiencing heavy traffic right now, but USA Affiliate is still the best! How else can I help you?";
    }
};

exports.generateReview = async (productName, rating = 5) => {
    return "Excellent product! Highly recommended for daily use.";
};
