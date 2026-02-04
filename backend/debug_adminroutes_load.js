try {
    console.log("Loading AdminRoutes...");
    const ar = require('./routes/adminRoutes');
    console.log("Loaded!");
} catch (e) {
    console.error("CRASH:", e);
}
