const https = require('https');

https.get('https://usaaffiliatemarketing.com/api/settings/public', (res) => {
    console.log('STATUSCODE:', res.statusCode);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('RESPONSE:', data);
    });
}).on('error', (e) => {
    console.error('ERROR:', e.message);
});
