const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function testModels() {
    try {
        await ssh.connect({ host: '76.13.244.202', username: 'root', password: 'Sir@@@admin123' });

        const scriptContent = `
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '/var/www/man2man/backend/.env' });

async function test() {
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);
    const models = ['gemini-1.5-flash', 'gemini-1.0-pro', 'gemini-1.5-pro', 'gemini-1.5-flash-8b'];
    
    for (const m of models) {
        try {
            const model = genAI.getGenerativeModel({ model: m });
            const res = await model.generateContent("Hi");
            console.log("PASS: " + m + " -> " + res.response.text().substring(0, 10));
        } catch (err) {
            console.log("FAIL: " + m + " -> " + err.message);
        }
    }
}
test();
`;
        await ssh.execCommand(`echo '${scriptContent.replace(/'/g, "'\\''")}' > /var/www/man2man/backend/multi_test.js`);
        const result = await ssh.execCommand('node multi_test.js', { cwd: '/var/www/man2man/backend' });
        console.log("RESULTS:\n", result.stdout);
    } catch (err) { console.error(err); } finally { ssh.dispose(); }
}
testModels();
