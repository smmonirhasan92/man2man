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
        const title = isReset ? 'Password Reset Code' : 'Email Verification Code';
        const color = isReset ? '#ef4444' : '#10b981'; // Red for reset, Emerald for verify

        // Premium HTML Template
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
                                    <h1 style="color: ${color}; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;">USA Affiliate</h1>
                                    <p style="color: #64748b; margin: 5px 0 0 0; font-size: 12px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase;">Security Protocol</p>
                                </td>
                            </tr>
                            
                            <!-- Body -->
                            <tr>
                                <td style="padding: 40px 30px;">
                                    <h2 style="color: #f1f5f9; margin: 0 0 20px 0; font-size: 20px;">${title}</h2>
                                    <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 30px 0;">
                                        You recently requested a security code for your account. Please use the following 6-digit code to complete your request.
                                    </p>
                                    
                                    <!-- OTP Box -->
                                    <div style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 25px; text-align: center;">
                                        <span style="font-family: monospace; font-size: 42px; font-weight: bold; letter-spacing: 12px; color: ${color}; text-shadow: 0 0 20px ${color}40;">
                                            ${otp}
                                        </span>
                                    </div>
                                    
                                    <p style="color: #64748b; font-size: 13px; text-align: center; margin: 30px 0 0 0;">
                                        This code will expire in <strong style="color: #e2e8f0;">5 minutes</strong>.<br>
                                        If you did not request this code, please ignore this email.
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Footer -->
                            <tr>
                                <td style="background-color: #0f172a; padding: 20px; text-align: center; border-top: 1px solid #1e293b;">
                                    <p style="color: #475569; font-size: 11px; margin: 0;">
                                        &copy; ${new Date().getFullYear()} USA Affiliate Network. All rights reserved.<br>
                                        Secure Automated Message
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

        await this.sendEmail(email, title, html);
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
