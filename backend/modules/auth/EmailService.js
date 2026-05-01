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
        const mailOptions = {
            from: `"${process.env.APP_NAME || 'USA Affiliate'}" <${process.env.SMTP_FROM || 'noreply@usaaffiliatemarketing.com'}>`,
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
             await redisConfig.client.set(key, otp, { EX: 300 }); // 5 mins
        } else {
             // Fallback to memory map if redis not running
             if (!this.memoryOtp) this.memoryOtp = {};
             this.memoryOtp[key] = { otp, exp: Date.now() + 300000 };
        }

        const isReset = context === 'password_reset';
        const title = isReset ? 'Reset Your Password' : 'Verify Your Email';
        const color = isReset ? '#ef4444' : '#10b981'; // Red for reset, Emerald for verify

        // [NEW] Premium World-Class Professional HTML Template
        const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
                body { margin: 0; padding: 0; background-color: #020617; font-family: 'Outfit', sans-serif; -webkit-font-smoothing: antialiased; }
                .wrapper { width: 100%; table-layout: fixed; background-color: #020617; padding-bottom: 60px; }
                .main { background-color: #0b1221; margin: 0 auto; width: 100%; max-width: 500px; border-radius: 32px; border: 1px solid rgba(255,255,255,0.05); overflow: hidden; margin-top: 50px; box-shadow: 0 20px 50px rgba(0,0,0,0.3); }
                .header { padding: 40px; text-align: center; background: linear-gradient(180deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0) 100%); }
                .brand { font-size: 20px; font-weight: 900; color: #10b981; letter-spacing: 4px; text-transform: uppercase; margin: 0; }
                .content { padding: 0 40px 40px 40px; text-align: center; }
                .title { color: #ffffff; font-size: 24px; font-weight: 800; margin-bottom: 12px; }
                .subtitle { color: #94a3b8; font-size: 15px; line-height: 1.6; margin-bottom: 35px; }
                .otp-box { background: rgba(2, 6, 23, 0.8); border: 1px solid #1e293b; border-radius: 20px; padding: 35px; margin-bottom: 30px; position: relative; }
                .otp-code { font-size: 48px; font-weight: 900; letter-spacing: 12px; color: ${color}; margin: 0; line-height: 1; }
                .copy-hint { color: #64748b; font-size: 11px; margin-top: 15px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
                .footer { padding: 30px; text-align: center; background-color: #020617; border-top: 1px solid #1e293b; }
                .footer-text { color: #475569; font-size: 11px; margin: 0; letter-spacing: 0.5px; }
                .divider { height: 1px; background: linear-gradient(90deg, transparent, #1e293b, transparent); margin: 30px 0; }
            </style>
        </head>
        <body>
            <center class="wrapper">
                <table class="main" width="100%">
                    <tr>
                        <td class="header">
                            <h1 class="brand">USA AFFILIATE</h1>
                        </td>
                    </tr>
                    <tr>
                        <td class="content">
                            <h2 class="title">${title}</h2>
                            <p class="subtitle">Secure authorization required. Use the unique access code below to complete your process.</p>
                            
                            <div class="otp-box">
                                <h3 class="otp-code">${otp}</h3>
                                <p class="copy-hint">Double tap to select and copy</p>
                            </div>
                            
                            <p style="color: #64748b; font-size: 12px; margin: 0;">This code will expire in 5 minutes for your security.</p>
                            <div class="divider"></div>
                            <p style="color: #475569; font-size: 11px; line-height: 1.5;">If you did not request this code, please ignore this email or contact support if you feel this is a mistake.</p>
                        </td>
                    </tr>
                    <tr>
                        <td class="footer">
                            <p class="footer-text">© ${new Date().getFullYear()} USA Affiliate Official Node Network</p>
                            <p style="color: #1e293b; font-size: 10px; margin-top: 10px;">Security Protocol: X-Mailer: USA-Affiliate-Node-v2</p>
                        </td>
                    </tr>
                </table>
            </center>
        </body>
        </html>
        `;

        const subject = `${otp} is your USA Affiliate code`; // Code first for mobile notifications
        await this.sendEmail(email, subject, html);
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
        <body style="margin: 0; padding: 0; background-color: #020617; font-family: sans-serif; color: #f8fafc;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #020617; padding: 40px 0;">
                <tr>
                    <td align="center">
                        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #0b1221; border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05);">
                            <tr><td height="4" style="background: linear-gradient(90deg, #10b981, #3b82f6);"></td></tr>
                            <tr>
                                <td style="padding: 40px; text-align: center;">
                                    <h1 style="color: #ffffff; font-size: 28px; margin-bottom: 20px;">Welcome, ${fullName}!</h1>
                                    <p style="color: #94a3b8; font-size: 16px; line-height: 1.6;">
                                        Your account has been successfully created. You are now part of the most advanced affiliate network in the USA.
                                    </p>
                                    <div style="margin: 40px 0;">
                                        <a href="https://usaaffiliatemarketing.com/dashboard" style="background: #10b981; color: white; padding: 15px 30px; border-radius: 12px; text-decoration: none; font-weight: bold;">Enter Dashboard</a>
                                    </div>
                                    <p style="color: #64748b; font-size: 14px;">
                                        If you didn't create this account, please ignore this email.
                                    </p>
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
                <p style="color: #94a3b8; font-size: 15px; line-height: 1.6;">A buyer wants to purchase NXS from you.</p>
                <div style="background-color: #0f172a; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <p style="color: #f1f5f9; margin: 0 0 10px 0;">Amount: <strong style="color: #3b82f6;">${transactionData.amount} NXS</strong></p>
                    <p style="color: #f1f5f9; margin: 0;">Fiat Value: <strong>$${transactionData.fiatAmount}</strong></p>
                </div>
                <p style="color: #e2e8f0; font-weight: bold;">Please check your P2P Dashboard to release the funds or chat with the buyer.</p>
            `;
        } else if (type === 'order_paid') {
            title = 'Payment Sent by Buyer';
            headerColor = '#f59e0b'; // Amber
            messageHtml = `
                <p style="color: #94a3b8; font-size: 15px; line-height: 1.6;">The buyer has marked the payment as sent.</p>
                <div style="background-color: #0f172a; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <p style="color: #f1f5f9; margin: 0;">Order ID: <strong>${transactionData.orderId}</strong></p>
                </div>
                <p style="color: #e2e8f0; font-weight: bold;">Please verify the payment in your bank/wallet before releasing the NXS.</p>
            `;
        } else if (type === 'order_completed') {
            title = 'Transaction Completed';
            headerColor = '#10b981'; // Emerald
            messageHtml = `
                <p style="color: #94a3b8; font-size: 15px; line-height: 1.6;">The seller has released the NXS to your wallet!</p>
                <div style="background-color: #0f172a; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <p style="color: #f1f5f9; margin: 0 0 10px 0;">Received: <strong style="color: #10b981;">${transactionData.amount} NXS</strong></p>
                    <p style="color: #f1f5f9; margin: 0;">Status: <strong style="color: #10b981;">SUCCESS</strong></p>
                </div>
            `;
        }

        const html = `
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 0; background-color: #070b14; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #f1f5f9;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #070b14; padding: 40px 0;">
                <tr>
                    <td align="center">
                        <table width="100%" max-width="600px" cellpadding="0" cellspacing="0" style="background-color: #0b1221; border-radius: 20px; overflow: hidden; border: 1px solid #1e293b; margin: 0 20px;">
                            <!-- Header -->
                            <tr>
                                <td style="padding: 30px; text-align: center; border-bottom: 1px solid #1e293b;">
                                    <h1 style="color: ${headerColor}; margin: 0; font-size: 20px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">P2P Trading Desk</h1>
                                </td>
                            </tr>
                            
                            <!-- Body -->
                            <tr>
                                <td style="padding: 40px 30px;">
                                    <h2 style="color: #f1f5f9; margin: 0 0 20px 0; font-size: 20px;">${title}</h2>
                                    ${messageHtml}
                                    
                                    <div style="text-align: center; margin-top: 30px;">
                                        <a href="https://usaaffiliatemarketing.com/dashboard/p2p" style="background-color: ${headerColor}; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 8px; font-weight: bold; display: inline-block;">View Transaction</a>
                                    </div>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #0f172a; padding: 20px; text-align: center; border-top: 1px solid #1e293b;">
                                    <p style="color: #475569; font-size: 11px; margin: 0;">
                                        USA Affiliate Network - Global P2P Exchange<br>
                                        Do not reply to this email.
                                    </p>
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
