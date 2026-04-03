const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '/var/www/man2man/backend/.env' });

async function testKey() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("Testing Key:", apiKey ? apiKey.substring(0, 5) + "..." : "MISSING");

    if (!apiKey) return;

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Say 'Key is working'");
        console.log("RESPONSE:", result.response.text());
    } catch (err) {
        console.error("TEST FAILED:", err.message);
    }
}

testKey();
