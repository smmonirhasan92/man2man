try {
    console.log("Loading AuthMiddleware...");
    require('./middleware/authMiddleware');
    console.log("AuthMiddleware OK");
} catch (e) {
    console.error("CRASH:", e);
}
