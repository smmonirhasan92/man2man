const http = require('http');

const data = JSON.stringify({
    phone: '01700000000', // Target User
    password: '000000' // Seeded Password
});

const options = {
    hostname: 'localhost',
    port: 5050, // Correct port
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log('--- Sending Login Request ---');

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

    let body = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('BODY: ' + body);
        try {
            const json = JSON.parse(body);
            if (json.token) {
                console.log('✅ Token received. Testing /api/auth/me ...');
                testMe(json.token);
            } else {
                console.error('❌ No token in response.');
            }
        } catch (e) { console.error('Parse Error:', e); }
    });
});

req.on('error', (e) => {
    console.error(`PROBLEM: ${e.message}`);
});

req.write(data);
req.end();

function testMe(token) {
    const opts = {
        hostname: 'localhost',
        port: 5050,
        path: '/api/auth/me',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    };
    const req2 = http.request(opts, (res) => {
        console.log(`ME STATUS: ${res.statusCode}`);
        let body2 = '';
        res.on('data', c => body2 += c);
        res.on('end', () => {
            console.log('ME BODY: ' + body2);
            testAudit(token); // Chain next test
        });
    });
    req2.end();
}

function testAudit(token) {
    const opts = {
        hostname: 'localhost',
        port: 5050,
        path: '/api/admin/audit/financial',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    };
    const req3 = http.request(opts, (res) => {
        console.log(`AUDIT STATUS: ${res.statusCode}`);
        let body3 = '';
        res.on('data', c => body3 += c);
        res.on('end', () => {
            console.log('AUDIT BODY: ' + body3);
            testLottery(token);
        });
    });
    req3.end();
}

function testLottery(token) {
    const opts = {
        hostname: 'localhost',
        port: 5050,
        path: '/api/lottery/active',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        }
    };
    const req4 = http.request(opts, (res) => {
        console.log(`LOTTERY STATUS: ${res.statusCode}`);
        let body4 = '';
        res.on('data', c => body4 += c);
        res.on('end', () => console.log('LOTTERY BODY: ' + body4));
    });
    req4.end();
}
