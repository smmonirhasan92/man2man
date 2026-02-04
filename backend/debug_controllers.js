try {
    console.log("Loading AdminController...");
    require('./controllers/adminController');
    console.log("AdminController OK");

    console.log("Loading UserController...");
    require('./controllers/userController');
    console.log("UserController OK");
} catch (e) {
    console.error("CRASH:", e);
}
