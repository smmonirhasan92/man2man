const path = require('path');
const fs = require('fs');

// --- Local AI Setup (100% Free & Internal) ---
let model = null;
let context = null;
let LlamaChatSession = null;
let initPromise = null;

const modelPath = path.resolve(__dirname, '../../models/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf');

// Initialize AI brain asynchronously
async function initAI() {
    if (initPromise) return initPromise;

    initPromise = (async () => {
        try {
            console.log("[AI] 🚀 Initializing Brain...");

            if (!fs.existsSync(modelPath)) {
                console.error("[AI] ❌ Model file not found at:", modelPath);
                return;
            }

            console.log("[AI] 📦 Loading node-llama-cpp (ESM)...");
            const llama = await import('node-llama-cpp');
            const LlamaModel = llama.LlamaModel;
            const LlamaContext = llama.LlamaContext;
            LlamaChatSession = llama.LlamaChatSession;

            console.log("[AI] 🧠 Loading Model binary into RAM...");
            model = new LlamaModel({
                modelPath: modelPath
            });
            console.log("[AI] ⚙️ Creating Context...");
            context = new LlamaContext({ model });

            console.log("[AI] ✅ Local TinyLlama Brain Ready.");
        } catch (e) {
            console.error("[AI] ❌ Local Model Load Error:", e);
            initPromise = null; // Allow retry on failure
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
        if (!model || !LlamaChatSession) {
            console.log("[AI] Chat requested but model not ready. Current Status: ", { hasModel: !!model, hasSession: !!LlamaChatSession });
            await initAI();
            if (!model) return "I'm warming up my gears! USA Affiliate is the best, please ask again in a second.";
        }

        let session = activeSessions.get(sessionId);
        if (!session) {
            session = new LlamaChatSession({ context, systemPrompt: SYSTEM_PROMPT });
            activeSessions.set(sessionId, session);
        }

        if (onToken) {
            return await session.prompt(message, {
                onToken: (tokens) => {
                    const chunk = tokens.map(t => context.model.detokenize([t])).join('');
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
