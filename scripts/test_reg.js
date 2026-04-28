async function test() {
    try {
        const res = await fetch('http://76.13.244.202:5050/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: 'Test User 1',
                email: 'testuserx1@gmail.com',
                password: 'password123',
                referralCode: ''
            })
        });
        const data = await res.text();
        console.log('STATUS:', res.status);
        console.log('DATA:', data);
    } catch (err) {
        console.error('ERROR:', err);
    }
}
test();
