const express = require('express');
const app = express();

console.log('Testing Express 5.x wildcards...');
try {
    app.options('*', (req, res) => res.send('ok'));
    console.log('[PASS] app.options("*") works.');
} catch (e) {
    console.error('[FAIL] app.options("*") CRASHED!');
    console.error(e.message);
}
