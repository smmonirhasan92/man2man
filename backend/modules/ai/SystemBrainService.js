const path = require('path');
const fs = require('fs');

// --- Local AI Setup (node-llama-cpp v3) ---
let llama = null;
let model = null;
let context = null;
let LlamaChatSession = null;
let initPromise = null;

const modelPath = path.resolve(__dirname, '../../models/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf');

async function initAI() {
    if (initPromise) return initPromise;

    initPromise = (async () => {
        try {
            console.log("[AI] 🚀 Initializing Engine...");

            if (!fs.existsSync(modelPath)) {
                throw new Error("Model file not found at: " + modelPath);
            }

            const llamaCpp = await import('node-llama-cpp');
            LlamaChatSession = llamaCpp.LlamaChatSession;

            llama = await llamaCpp.getLlama();

            console.log("[AI] 🧠 Loading Model binary...");
            model = await llama.loadModel({ modelPath });

            console.log("[AI] 💎 Creating Context...");
            context = await model.createContext();

            console.log("[AI] ✅ Local AI Ready.");
        } catch (e) {
            console.error("[AI] ❌ Init Error:", e);
            initPromise = null;
            throw e;
        }
    })();

    return initPromise;
}

// Start early
initAI().catch(() => { });

const SYSTEM_PROMPT = `You are a friendly, human-like support representative for "USA Affiliate".
Rules:
1. Persona: You are named "Support AI".
2. Platform: USA Affiliate (usaaffiliatemarketing.com) is a secure video task earning platform.
3. Tone: 100% POSITIVE and polite.
4. Brevity: Keep responses under 3 sentences.`;

const activeSessions = new Map();

exports.chat = async (message, onToken = null, sessionId = 'default') => {
    try {
        if (!model || !context || !LlamaChatSession) {
            console.log("[AI] Waiting for initialization...");
            await initAI();
        }

        let session = activeSessions.get(sessionId);
        if (!session) {
            session = new LlamaChatSession({ context, systemPrompt: SYSTEM_PROMPT });
            activeSessions.set(sessionId, session);
        }

        if (onToken) {
            return await session.prompt(message, {
                onToken: (tokens) => {
                    const chunk = model.detokenize(tokens);
                    onToken(chunk);
                }
            });
        } else {
            return await session.prompt(message);
        }
    } catch (err) {
        console.error('[AI] Chat Error:', err);
        return "I'm warming up my gears! USA Affiliate is 100% secure. Please ask again in a moment.";
    }
};

exports.generateReview = async (productName, rating = 5) => {
    return "Excellent product! Highly recommended.";
};
