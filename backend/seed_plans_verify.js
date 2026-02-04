const axios = require('axios');

async function seed() {
    try {
        console.log("Seeding Plans...");
        const res = await axios.post('http://127.0.0.1:5050/api/plan/seed');
        console.log("Result:", res.data);
    } catch (e) {
        console.error("Error:", e.message);
        if (e.response) console.error(e.response.data);
    }
}

seed();
