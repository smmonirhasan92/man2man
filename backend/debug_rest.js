try {
    console.log("Loading AnalyticsController...");
    require('./controllers/analyticsController');
    console.log("AnalyticsController OK");

    console.log("Loading AuthMiddleware...");
    require('./middleware/authMiddleware');
    console.log("AuthMiddleware OK");

    console.log("Loading AdminRoutes again...");
    require('./routes/adminRoutes');
    console.log("AdminRoutes OK");

} catch (e) {
    console.error("CRASH:", e);
}
