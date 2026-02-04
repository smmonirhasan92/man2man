try {
    console.log("Loading server...");
    require('./server.js');
} catch (e) {
    console.error("CRASH DETECTED:");
    console.error(e);
}
