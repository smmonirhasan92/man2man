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

        // Premium World-Class HTML Template
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #020617; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #020617; padding: 40px 0;">
                <tr>
                    <td align="center">
                        <!-- Main Container -->
                        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #0b1221; border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); margin: 0 20px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                            
                            <!-- Premium Header Gradient Bar -->
                            <tr><td height="4" style="background: linear-gradient(90deg, #1d4ed8, #ffffff, #b91c1c); line-height: 4px; font-size: 4px;">&nbsp;</td></tr>

                            <!-- Header / Brand -->
                            <tr>
                                <td style="padding: 40px 40px 30px 40px; text-align: center;">
                                    <div style="margin-bottom: 20px;">
                                        <span style="font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: 4px; text-transform: uppercase; display: inline-block;">USA AFFILIATE</span>
                                    </div>
                                    <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent); width: 100%;"></div>
                                </td>
                            </tr>
                            
                            <!-- Content Body -->
                            <tr>
                                <td style="padding: 0 40px 40px 40px; text-align: center;">
                                    <h2 style="color: #ffffff; margin: 0 0 16px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">${title}</h2>
                                    <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 40px 0; max-width: 400px; margin-left: auto; margin-right: auto;">
                                        Protecting your account is our top priority. Please use the secure authorization code below to proceed.
                                    </p>
                                    
                                    <!-- Premium OTP Display -->
                                    <div style="background: linear-gradient(145deg, #0f172a, #1e293b); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 40px 20px; margin-bottom: 40px; box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);">
                                        <div style="color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px;">Your One-Time Code</div>
                                        <div style="font-family: 'Courier New', Courier, monospace; font-size: 48px; font-weight: 900; letter-spacing: 16px; color: ${color}; text-shadow: 0 0 30px ${color}40; margin-left: 16px;">
                                            ${otp}
                                        </div>
                                    </div>
                                    
                                    <div style="background-color: rgba(255,255,255,0.03); border-radius: 12px; padding: 15px; margin-bottom: 20px;">
                                        <p style="color: #64748b; font-size: 13px; margin: 0;">
                                            Valid for the next <strong style="color: #f1f5f9;">5 minutes</strong>. <br>
                                            Request ID: <span style="font-family: monospace;">#${Math.random().toString(36).substring(7).toUpperCase()}</span>
                                        </p>
                                    </div>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #020617; padding: 30px 40px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05);">
                                    <p style="color: #475569; font-size: 12px; line-height: 1.8; margin: 0;">
                                        <strong>USA Affiliate Official</strong><br>
                                        Secure Access Portal & Node Network<br>
                                        <span style="color: #334155;">&copy; ${new Date().getFullYear()} Global Operations.</span>
                                    </p>
                                    <div style="margin-top: 20px;">
                                        <a href="#" style="color: #64748b; text-decoration: none; font-size: 11px; margin: 0 10px;">Privacy Policy</a>
                                        <a href="#" style="color: #64748b; text-decoration: none; font-size: 11px; margin: 0 10px;">Security Guide</a>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        `;

        const subject = `${title} [${otp}]`; // Include code in subject for better visibility
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
