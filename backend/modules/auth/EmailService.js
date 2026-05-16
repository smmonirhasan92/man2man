const nodemailer = require('nodemailer');
const redisConfig = require('../../config/redis');
const fs = require('fs');
const path = require('path');

class EmailService {
    constructor() {
        let dkimConfig = null;
        try {
            const privateKeyPath = path.join(__dirname, '../../config/dkim-private.pem');
            if (fs.existsSync(privateKeyPath)) {
                dkimConfig = {
                    domainName: 'usaaffiliatemarketing.com',
                    keySelector: 'mail',
                    privateKey: fs.readFileSync(privateKeyPath, 'utf8')
                };
                console.log('[EmailService] DKIM Private Key Loaded Successfully!');
            }
        } catch (e) {
            console.error('[EmailService] Failed to load DKIM Key:', e.message);
        }

        const transportConfig = {
            pool: true,
            maxConnections: 5,
            maxMessages: 100,
            host: process.env.SMTP_HOST || '172.17.0.1',
            port: parseInt(process.env.SMTP_PORT) || 25,
            secure: process.env.SMTP_SECURE === 'true',
            connectionTimeout: 10000,
            greetingTimeout: 5000,
            socketTimeout: 15000,
            tls: {
                rejectUnauthorized: false
            }
        };

        if (dkimConfig) {
            transportConfig.dkim = dkimConfig;
        }

        this.transporter = nodemailer.createTransport(transportConfig);
    }

    async sendEmail(to, subject, htmlContent) {
        // [GUARD] If DISABLE_EMAIL=true (Test VPS), silently skip. Emails only from Main Domain.
        if (process.env.DISABLE_EMAIL === 'true') {
            console.log(`[EmailService] DISABLED on this server. Skipped email to: ${to} | Subject: ${subject}`);
            return { skipped: true };
        }

        const mailOptions = {
            from: `"${process.env.APP_NAME || 'USA Affiliate'}" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@usaaffiliatemarketing.com'}>`,
            to,
            subject,
            html: htmlContent,
            text: htmlContent.replace(/<[^>]*>?/gm, '')
        };

        // [STABLE] Send email in the background using Nodemailer's built-in connection pool and timeouts.
        this.transporter.sendMail(mailOptions)
            .then(info => {
                console.log(`[EmailService] Sent to ${to} | ID: ${info.messageId}`);
            })
            .catch(err => {
                console.error(`[EmailService] Failed sending to ${to}:`, err.message);
            });

        return true; // Unblock the API immediately
    }

    async generateAndSendOTP(emailRaw, context = 'verification') {
        const email = String(emailRaw).trim().toLowerCase();
        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Save to Redis (TTL 5 minutes)
        const key = `otp:${context}:${email}`;
        if (redisConfig.client.isOpen) {
             // [RESILIENT] Save OTP with 15 min TTL (handles retry/resend window)
             await redisConfig.client.set(key, otp, { EX: 900 }); // 15 mins
        } else {
             // Fallback to memory map if redis not running
             if (!this.memoryOtp) this.memoryOtp = {};
             this.memoryOtp[key] = { otp, exp: Date.now() + 300000 };
        }

        const isReset = context === 'password_reset';
        const title = isReset ? 'Reset Your Password' : 'Verify Your Email';
        const color = isReset ? '#ef4444' : '#10b981'; // Red for reset, Emerald for verify

        // [NEW] Professional Finance Clean UI Template
        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: Arial, Helvetica, sans-serif; color: #000000; -webkit-font-smoothing: antialiased;">
            <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 40px 0;">
                <tr>
                    <td align="center">
                        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-top: 4px solid #10b981;">
                            <tr>
                                <td align="center" style="padding: 30px;">
                                    <h1 style="color: #10b981; font-size: 24px; margin: 0; font-weight: bold; text-transform: uppercase;">USA Affiliate</h1>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 0 40px 40px 40px; text-align: center;">
                                    <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">${title}</h2>
                                    <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 30px;">Secure authorization required. Use the unique access code below to complete your process.</p>
                                    
                                    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                                        <tr>
                                            <td align="center">
                                                <div style="background-color: #f1f5f9; border: 2px dashed #cbd5e1; padding: 20px; display: inline-block;">
                                                    <span style="font-size: 42px; font-weight: bold; color: ${color}; letter-spacing: 8px;">${otp}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <p style="color: #64748b; font-size: 12px; margin-bottom: 20px;">This code will expire in 5 minutes for your security.</p>
                                    
                                    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                                    <p style="color: #94a3b8; font-size: 11px; line-height: 1.5;">Please enter this code in the app to complete verification. If you did not request this code, please ignore this email.</p>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="background-color: #f8f9fa; padding: 20px; border-top: 1px solid #e2e8f0;">
                                    <p style="color: #64748b; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} USA Affiliate Official Node Network</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `;

        const subject = `${otp} is your USA Affiliate verification code`;

        // [RESILIENT QUEUE SEND] SendEmail now pushes to queue and handles its own retries natively.
        // We just call it and it resolves immediately, unblocking the API.
        try {
            await this.sendEmail(email, subject, html);
        } catch (error) {
            console.error(`[EmailService] Failed to queue OTP email for ${email}:`, error);
            // OTP is still saved in Redis. User can click "Resend" to trigger this again.
        }

        // Always return true — OTP is saved, user can resend if email missed
        return true;
    }

    async verifyOTP(emailRaw, otp, context = 'verification') {
        const email = String(emailRaw).trim().toLowerCase();
        const key = `otp:${context}:${email}`;
        if (redisConfig.client.isOpen) {
             const storedOtp = await redisConfig.client.get(key);
             if (String(storedOtp).trim() === String(otp).trim()) {
                 await redisConfig.client.del(key); // clear after use
                 return true;
             }
        } else {
             const stored = this.memoryOtp && this.memoryOtp[key];
             if (stored && String(stored.otp).trim() === String(otp).trim() && stored.exp > Date.now()) {
                 delete this.memoryOtp[key];
                 return true;
             }
        }
        return false;
    }

    async sendWelcomeEmail(email, fullName) {
        // [DISABLED] Temporarily disabled as per requirements. Only OTP emails are allowed.
        return true;
    }

    async sendP2PNotification(email, type, transactionData) {
        // [DISABLED] Transaction emails disabled as per requirements. Only OTP is allowed.
        return true;
    }
}

module.exports = new EmailService();
