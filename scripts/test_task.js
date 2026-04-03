const axios = require('axios');
axios.post('https://usaaffiliatemarketing.com/api/task/start', { taskId: '123' }, {
    headers: {
        'Authorization': 'Bearer 123',
        'x-usa-identity': '+1 (719) 664-6213'
    }
}).then(res => console.log(res.data)).catch(err => console.error(err.response ? err.response.data : err.message));
