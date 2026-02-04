const axios = require('axios');

async function trigger() {
    console.log('⏳ Waiting 20s to trigger notification...');
    await new Promise(r => setTimeout(r, 20000));

    try {
        console.log('🚀 Firing Notification 1!');
        await axios.post('http://localhost:5000/api/admin/test-notify', {
            userId: 'ALL', // Or specific logic if I implement it
            message: 'Real-time Test: Success! 🚀',
            type: 'success'
        });

        await new Promise(r => setTimeout(r, 2000));

        console.log('🚀 Firing Notification 2!');
        await axios.post('http://localhost:5000/api/admin/test-notify', {
            message: 'Second Alert: Works!',
            type: 'info'
        });

    } catch (e) {
        console.error('Trigger Failed:', e.message);
    }
}

trigger();
