const path = require('path');
const fs = require('fs');

// --- Local AI Setup (100% Free & Internal) ---
let model = null;
let context = null;
let chatSessionClass = null;
let initPromise = null;

const modelPath = path.resolve(__dirname, '../../models/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf');

// Initialize AI brain asynchronously
async function initAI() {
    if (initPromise) return initPromise;

    initPromise = (async () => {
        try {
            console.log("[AI] 🚀 Initializing Brain (v3 API)...");

            if (!fs.existsSync(modelPath)) {
                console.error("[AI] ❌ Model file not found at:", modelPath);
                return;
            }

            console.log("[AI] 📦 Loading node-llama-cpp...");
            const { getLlama } = await import('node-llama-cpp');

            console.log("[AI] ⚙️ Getting Llama Engine...");
            const llama = await getLlama();

            console.log("[AI] 🧠 Loading Model...");
            model = await llama.loadModel({
                modelPath: modelPath
            });

            console.log("[AI] 💎 Creating Context...");
            context = await model.createContext();

            // In v3, session might be LlamaChatSession
            const llamaCpp = await import('node-llama-cpp');
            chatSessionClass = llamaCpp.LlamaChatSession;

            console.log("[AI] ✅ Local TinyLlama Brain Ready.");
        } catch (e) {
            console.error("[AI] ❌ Local Model Load Error:", e);
            initPromise = null;
        }
    })();

    return initPromise;
}

// Start initialization immediately
initAI();

const SYSTEM_PROMPT = `You are a friendly, human-like support representative for "USA Affiliate".
Rules:
1. Persona: You are named "Support AI".
2. Platform: USA Affiliate (usaaffiliatemarketing.com) is a secure video task earning platform.
3. Tone: 100% POSITIVE and polite. Reassure users that funds are safe.
4. Brevity: Keep responses under 3 sentences.
5. P2P: Mention P2P for buying/selling NxS safely.`;

const activeSessions = new Map();

exports.chat = async (message, onToken = null, sessionId = 'default') => {
    try {
        // Ensure initialized
        if (!model || !chatSessionClass) {
            console.log("[AI] Chat requested but model not ready.");
            await initAI();
            if (!model) return "I'm warming up my gears! USA Affiliate is the best, please ask again in a second.";
        }

        let session = activeSessions.get(sessionId);
        if (!session) {
            session = new chatSessionClass({ context, systemPrompt: SYSTEM_PROMPT });
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
        console.error('[AI] Local Chat Error:', err);
        return "Our network is very busy with happy users, but USA Affiliate is 100% secure! How can I help?";
    }
};

exports.generateReview = async (productName, rating = 5) => {
    return "Excellent product! Highly recommended for daily use.";
};
