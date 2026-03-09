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
            console.log("[AI] 🚀 Initializing Engine (v3)...");

            if (!fs.existsSync(modelPath)) {
                throw new Error("Model file not found at: " + modelPath);
            }

            const llamaCpp = await import('node-llama-cpp');
            LlamaChatSession = llamaCpp.LlamaChatSession;

            // v3 API
            llama = await llamaCpp.getLlama();

            console.log("[AI] 🧠 Loading Model...");
            model = await llama.loadModel({ modelPath });

            console.log("[AI] 💎 Creating Context...");
            // Use llama.createContext or model.createContext
            context = await llama.createContext({ model });

            if (!context) {
                console.log("[AI] Falling back to model.createContext()...");
                context = await model.createContext();
            }

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
1. Persona: You are "Support AI".
2. Platform: USA Affiliate is a video task earning platform.
3. Tone: 100% POSITIVE.
4. Brevity: Max 2-3 sentences.`;

const activeSessions = new Map();

exports.chat = async (message, onToken = null, sessionId = 'default') => {
    try {
        if (!model || !context || !LlamaChatSession) {
            console.log("[AI] Waiting for init...");
            await initAI();
            if (!context) throw new Error("Context failed to initialize");
        }

        let session = activeSessions.get(sessionId);
        if (!session) {
            session = new LlamaChatSession({ context });
            activeSessions.set(sessionId, session);
        }

        const options = { systemPrompt: SYSTEM_PROMPT };
        if (onToken) {
            options.onToken = (tokens) => {
                const chunk = model.detokenize(tokens);
                onToken(chunk);
            };
        }

        return await session.prompt(message, options);
    } catch (err) {
        console.error('[AI] Chat Error:', err);
        return "I'm warming up my gears! USA Affiliate is 100% secure. Please try again in 30 seconds.";
    }
};

exports.generateReview = async () => "Excellent platform! Highly recommended.";
