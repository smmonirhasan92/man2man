const nodemailer = require('nodemailer');
const t = nodemailer.createTransport({
    host: '172.17.0.1',
    port: 25,
    secure: false,
    tls: { rejectUnauthorized: false }
});

console.log("Testing SMTP connection...");
t.verify((err, ok) => {
    if (err) {
        console.log('SMTP ERROR:', err.message, err.code);
    } else {
        console.log('SMTP OK - Connection successful!');
    }
});

// Also try to send a real test email
setTimeout(async () => {
    try {
        const info = await t.sendMail({
            from: 'noreply@usaaffiliatemarketing.com',
            to: 'seamsarder2@gmail.com',
            subject: 'SMTP Test - ' + new Date().toISOString(),
            text: 'This is a test email from the backend SMTP relay.',
            html: '<p>This is a <b>test email</b> from the backend SMTP relay.</p>'
        });
        console.log('Email sent! MessageID:', info.messageId, 'Response:', info.response);
    } catch (e) {
        console.log('Email send FAILED:', e.message, e.code);
    }
    process.exit(0);
}, 3000);
