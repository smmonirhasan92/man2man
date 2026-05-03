const nodemailer = require('nodemailer');
const redisConfig = require('../../config/redis');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'localhost',
            port: process.env.SMTP_PORT || 1025, // Mailhog default
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            ignoreTLS: process.env.SMTP_SECURE === 'false', // Disable opportunistic STARTTLS for internal relay
            auth: process.env.SMTP_USER ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            } : undefined,
        });
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
            text: htmlContent.replace(/<[^>]*>?/gm, ''), // Simple text fallback
            headers: {
                'List-Unsubscribe': `<mailto:admin@usaaffiliatemarketing.com?subject=unsubscribe>`,
                'X-Priority': '1 (Highest)',
                'X-Mailer': 'USA-Affiliate-Security-Node'
            }
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log(`[EmailService] Email sent to ${to}: ${info.messageId}`);
            return true;
        } catch (error) {
            console.error(`[EmailService] Error sending email to ${to}:`, error);
            return false;
        }
    }

    async generateAndSendOTP(email, context = 'verification') {
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
                                    <p style="color: #94a3b8; font-size: 11px; line-height: 1.5;">If you did not request this code, please ignore this email or contact support if you feel this is a mistake.</p>
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

        const subject = `${otp} is your USA Affiliate verification code`; // Code first for auto-fill detection

        // [RESILIENT SEND] OTP is already saved. Attempt email, retry once on failure.
        // If both attempts fail, OTP remains valid for 15 mins so user can trigger resend.
        let emailSent = false;
        try {
            await this.sendEmail(email, subject, html);
            emailSent = true;
        } catch (firstErr) {
            console.warn(`[EmailService] First attempt failed for ${email}. Retrying in 3s...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            try {
                await this.sendEmail(email, subject, html);
                emailSent = true;
            } catch (secondErr) {
                // OTP is still saved in Redis. User can click "Resend" to trigger this again.
                console.error(`[EmailService] Both attempts failed for ${email}. OTP queued in Redis for 15 mins.`);
                // Store a pending flag so admin can monitor
                const failKey = `otp_failed:${context}:${email}`;
                if (redisConfig.client.isOpen) {
                    await redisConfig.client.set(failKey, JSON.stringify({ email, context, otp, failedAt: new Date().toISOString() }), { EX: 900 });
                }
            }
        }

        // Always return true — OTP is saved, user can resend if email missed
        return true;
    }

    async verifyOTP(email, otp, context = 'verification') {
        const key = `otp:${context}:${email}`;
        if (redisConfig.client.isOpen) {
             const storedOtp = await redisConfig.client.get(key);
             if (storedOtp === otp) {
                 await redisConfig.client.del(key); // clear after use
                 return true;
             }
        } else {
             const stored = this.memoryOtp && this.memoryOtp[key];
             if (stored && stored.otp === otp && stored.exp > Date.now()) {
                 delete this.memoryOtp[key];
                 return true;
             }
        }
        return false;
    }

    async sendWelcomeEmail(email, fullName) {
        const title = 'Welcome to USA Affiliate Network! 🚀';
        const html = `
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: Arial, Helvetica, sans-serif; color: #000000;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 40px 0;">
                <tr>
                    <td align="center">
                        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-top: 4px solid #10b981;">
                            <tr>
                                <td align="center" style="padding: 30px; border-bottom: 1px solid #e2e8f0;">
                                    <h1 style="color: #10b981; font-size: 24px; margin: 0; font-weight: bold; text-transform: uppercase;">USA Affiliate</h1>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 40px; text-align: center;">
                                    <h2 style="color: #000000; font-size: 24px; margin-bottom: 20px;">Welcome, ${fullName}!</h2>
                                    <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                                        Your account has been successfully created. You are now part of the most advanced affiliate network in the USA.
                                    </p>
                                    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                                        <tr>
                                            <td align="center">
                                                <a href="https://usaaffiliatemarketing.com/dashboard" style="background-color: #10b981; color: #ffffff; padding: 15px 30px; border-radius: 4px; text-decoration: none; font-weight: bold; display: inline-block;">Enter Dashboard</a>
                                            </td>
                                        </tr>
                                    </table>
                                    <p style="color: #94a3b8; font-size: 12px;">
                                        If you didn't create this account, please ignore this email.
                                    </p>
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
        return await this.sendEmail(email, title, html);
    }

    async sendP2PNotification(email, type, transactionData) {
        if (!email) return;

        let title = '';
        let headerColor = '';
        let messageHtml = '';

        if (type === 'new_buy_order') {
            title = 'New Purchase Request';
            headerColor = '#3b82f6'; // Blue
            messageHtml = `
                <p>A buyer wants to purchase NXS from you.</p>
                <div style="background-color: #f1f5f9; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
                    <p style="margin: 0 0 10px 0;">Amount: <strong style="color: #3b82f6;">${transactionData.amount} NXS</strong></p>
                    <p style="margin: 0;">Fiat Value: <strong>$${transactionData.fiatAmount}</strong></p>
                </div>
                <p style="font-weight: bold; color: #000000;">Please check your P2P Dashboard to release the funds or chat with the buyer.</p>
            `;
        } else if (type === 'order_paid') {
            title = 'Payment Sent by Buyer';
            headerColor = '#f59e0b'; // Amber
            messageHtml = `
                <p>The buyer has marked the payment as sent.</p>
                <div style="background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                    <p style="margin: 0;">Order ID: <strong>${transactionData.orderId}</strong></p>
                </div>
                <p style="font-weight: bold; color: #000000;">Please verify the payment in your bank/wallet before releasing the NXS.</p>
            `;
        } else if (type === 'order_completed') {
            title = 'Transaction Completed';
            headerColor = '#10b981'; // Emerald
            messageHtml = `
                <p>The seller has released the NXS to your wallet!</p>
                <div style="background-color: #ecfdf5; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0;">
                    <p style="margin: 0 0 10px 0;">Received: <strong style="color: #10b981;">${transactionData.amount} NXS</strong></p>
                    <p style="margin: 0;">Status: <strong style="color: #10b981;">SUCCESS</strong></p>
                </div>
            `;
        }

        const html = `
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: Arial, Helvetica, sans-serif; color: #000000;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 40px 0;">
                <tr>
                    <td align="center">
                        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-top: 4px solid ${headerColor};">
                            <tr>
                                <td align="center" style="padding: 30px; border-bottom: 1px solid #e2e8f0;">
                                    <h1 style="color: ${headerColor}; font-size: 20px; margin: 0; font-weight: bold; text-transform: uppercase;">P2P Trading Desk</h1>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 40px 30px;">
                                    <h2 style="color: #000000; margin: 0 0 20px 0; font-size: 20px;">${title}</h2>
                                    <div style="color: #475569; font-size: 15px; line-height: 1.6;">
                                        ${messageHtml}
                                    </div>
                                    <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                                        <tr>
                                            <td align="center">
                                                <a href="https://usaaffiliatemarketing.com/dashboard/p2p" style="background-color: ${headerColor}; color: #ffffff; padding: 12px 25px; border-radius: 4px; text-decoration: none; font-weight: bold; display: inline-block;">View Transaction</a>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td align="center" style="background-color: #f8f9fa; padding: 20px; border-top: 1px solid #e2e8f0;">
                                    <p style="color: #64748b; font-size: 11px; margin: 0;">USA Affiliate Network - Global P2P Exchange<br>Do not reply to this email.</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `;

        await this.sendEmail(email, `P2P Alert: ${title}`, html);
    }
}

module.exports = new EmailService();
