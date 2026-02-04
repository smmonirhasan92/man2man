const axios = require('axios');

async function testSpecificLogin() {
    try {
        const phone = "01985010101";
        const password = "Sir@0101";

        console.log(`Attempting login for ${phone}...`);

        const res = await axios.post('http://localhost:5000/api/auth/login', {
            phone: phone,
            password: password
        });

        console.log("Login Success!");
        console.log("Token received.");
        console.log("User:", res.data.user.fullName);

    } catch (error) {
        console.error("LOGIN FAILED:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Message:", error.response.data.message);
        } else {
            console.error(error.message);
        }
    }
}

testSpecificLogin();
