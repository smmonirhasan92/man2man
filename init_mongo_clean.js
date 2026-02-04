try {
    var config = {
        _id: "rs0",
        members: [
            { _id: 0, host: "127.0.0.1:27018" }
        ]
    };
    var status = rs.status();
    if (status.codeName === "NotYetInitialized" || status.ok === 0) {
        print("Initializing Replica Set...");
        rs.initiate(config);
        print("Initialization initiated. Waiting for PRIMARY...");
    } else {
        print("Replica Set already initialized. Status: " + status.myState);
    }
} catch (e) {
    print("Error: " + e);
}
