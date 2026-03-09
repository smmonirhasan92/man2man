const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function runRemoteTest() {
    try {
        await ssh.connect({
            host: '76.13.244.202',
            username: 'root',
            password: 'Sir@@@admin123',
        });

        const scriptContent = `
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '/var/www/man2man/backend/.env' });

async function testKey() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log("Testing Key:", apiKey ? apiKey.substring(0, 5) + "..." : "MISSING");
    if (!apiKey) return;
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hi");
        console.log("SUCCESS:", result.response.text());
    } catch (err) {
        console.log("FAILED:", err.message);
    }
}
testKey();
`;
        console.log("Writing remote test script...");
        await ssh.execCommand(`echo '${scriptContent.replace(/'/g, "'\\''")}' > /var/www/man2man/backend/temp_test_key.js`);

        console.log("Running remote test...");
        const result = await ssh.execCommand('node temp_test_key.js', { cwd: '/var/www/man2man/backend' });
        console.log("TEST RESULT:\n", result.stdout);
        console.log("TEST ERROR:\n", result.stderr);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        ssh.dispose();
    }
}

runRemoteTest();
