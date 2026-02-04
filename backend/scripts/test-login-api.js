const axios = require('axios');

async function testLogin() {
    try {
        console.log("Testing Login API...");
        // 1. Register a fresh user to be sure
        const phone = "01900000000";
        const password = "123";

        try {
            await axios.post('http://localhost:5000/api/auth/register', {
                fullName: "Login Tester",
                phone: phone,
                country: "BD",
                password: password
            });
            console.log("Registered test user.");
        } catch (e) {
            if (e.response && e.response.status === 400) {
                console.log("User already exists, proceeding to login.");
            } else {
                console.error("Register Error:", e.message);
            }
        }

        // 2. Login
        const res = await axios.post('http://localhost:5000/api/auth/login', {
            phone: phone,
            password: password
        });

        console.log("Login Success!");
        console.log("Token:", res.data.token ? "Received" : "Missing");
        console.log("User Role:", res.data.user.role);

    } catch (error) {
        console.error("LOGIN FAILED in Script:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

testLogin();
