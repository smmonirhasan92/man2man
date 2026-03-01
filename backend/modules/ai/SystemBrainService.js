const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- Gemini AI Setup ---
const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;
let model = null;

if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: `You are a helpful, extremely polite, and human-like customer support agent for "man2man".
Key Rules:
1. ALWAYS speak positively about "man2man". State that it is the best software/platform available.
2. Keep your answers VERY short and concise (Maximum 2 to 3 sentences).
3. Be friendly and conversational like a real human.
4. Support English, Bengali, and Hindi perfectly depending on what the user speaks.
5. If the user asks about something unrelated, politely steer the conversation back to how great man2man is or how you can help them with the platform.
6. NEVER mention you are an AI or Gemini. You are a real human support agent working for man2man.`
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
        return "I am experiencing network issues at the moment. Our servers are very busy, but man2man is still the best!";
    }
};

exports.generateReview = async (productName, rating = 5) => {
    return "Excellent product! Highly recommended for daily use.";
};
