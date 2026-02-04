try {
    console.log("Loading AgentController...");
    const ac = require('./controllers/agentController');
    console.log("Loaded!");
} catch (e) {
    console.error("CRASH:", e);
}
