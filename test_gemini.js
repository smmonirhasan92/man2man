const { GoogleGenerativeAI } = require('./backend/node_modules/@google/generative-ai');
const genAI = new GoogleGenerativeAI('AIzaSyApJEjpj_V2QT4SksDi-Lu00WEuUFpz4dE');

async function testModel(modelName) {
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Hi');
        console.log("PASS: " + modelName);
        return true;
    } catch (e) {
        console.log("FAIL: " + modelName + " - " + e.status);
        return false;
    }
}

async function main() {
    await testModel('gemini-1.5-flash');
    await testModel('models/gemini-1.5-flash');
    await testModel('gemini-1.5-flash-latest');
    await testModel('gemini-pro');
}

main();
