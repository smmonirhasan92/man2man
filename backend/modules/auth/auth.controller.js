const User = require('../user/UserModel');
const SystemSetting = require('../settings/SystemSettingModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const CryptoService = require('../security/CryptoService');
const PlanService = require('../plan/PlanService');
const EmailService = require('./EmailService');
const TransactionHelper = require('../common/TransactionHelper');

exports.register = async (req, res) => {
    try {
        console.log('Register Request Body:', req.body);
        let { fullName, email, password, referralCode } = req.body;

        // [FIX] Sanitize Inputs
        fullName = fullName?.trim();
        email = email?.trim().toLowerCase();
        password = password?.trim();
        referralCode = referralCode?.trim();

        // Basic Email Validation
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: 'Invalid email format.' });
        }

        // 2. Generate Username
        const username = fullName.split(' ')[0].toLowerCase() + Math.floor(1000 + Math.random() * 9000);

        // 3. Generate PERMANENT Referral ID
        const myReferralCode = CryptoService.generateReferralId();
        const expiresAt = null;

        // 4. Password Hashing
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 5 & 6: Atomic Registration
        const result = await TransactionHelper.runTransaction(async (session) => {
            // Check again inside session for absolute safety
            const existingUser = await User.findOne({ email }).session(session);
            if (existingUser) throw new Error('User already exists');

            // Referral Logic
            let referrerCodeStored = null;
            if (referralCode) {
                const referrer = await User.findOne({ referralCode }).session(session);
                if (referrer) {
                    referrerCodeStored = referralCode;
                    referrer.referralCount = (referrer.referralCount || 0) + 1;
                    await referrer.save({ session });
                }
            }

            // Create User
            const newUser = await User.create([{
                fullName,
                username,
                email, 
                emailVerified: true,
                password: hashedPassword,
                role: 'user',
                wallet: {
                    main: 0.00,
                    game: 0.00,
                    income: 0.00,
                    purchase: 0.00,
                    pending_referral: 0.00,
                    agent: 0.00
                },
                referralCode: myReferralCode,
                referralSecurity: {
                    currentId: myReferralCode,
                    expiresAt: expiresAt,
                    history: []
                },
                referredBy: referrerCodeStored,
                taskData: { accountTier: 'Starter' },
                deviceId: req.body.deviceId || null,
                lastIp: req.ip || '0.0.0.0',
                status: 'active'
            }], { session });

            const userDoc = newUser[0];

            // Generate JWT
            const payload = { user: { id: userDoc._id, role: userDoc.role } };
            const token = await new Promise((resolve, reject) => {
                jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret_key_12345', { expiresIn: '7d' }, (err, t) => {
                    if (err) reject(err);
                    resolve(t);
                });
            });

            return { user: userDoc, token };
        });

        // 8. Background Tasks (Non-blocking)
        EmailService.sendWelcomeEmail(email, fullName).catch(e => console.error("[WELCOME EMAIL] Failed:", e.message));

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token: result.token,
            user: {
                id: result.user._id,
                username: result.user.username,
                role: result.user.role,
                fullName: result.user.fullName,
                email: result.user.email,
                emailVerified: result.user.emailVerified
            }
        });

    } catch (err) {
        console.error('Registration Error:', err.stack);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        console.log('Login Request Body:', req.body);
        let { identifier, email, phone, primary_phone, password } = req.body;
        identifier = identifier || email || phone || primary_phone; // Support all frontends

        if (!identifier) {
            return res.status(400).json({ message: 'Email or Phone number is required.' });
        }

        identifier = identifier.trim().toLowerCase();
        password = (password || '').trim();

        let user;
        const isEmail = identifier.includes('@');

        if (isEmail) {
            user = await User.findOne({ email: identifier });
        } else {
            // Legacy Phone Lookup
            const rawPhone = identifier.replace(/^\+88/, '');
            user = await User.findOne({
                primary_phone: { $in: [rawPhone, `+88${rawPhone}`] }
            });
        }

        if (!user) {
            console.log('❌ Auth Fail: User not found for:', identifier);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (user.status === 'blocked' || user.status === 'restricted') {
            return res.status(403).json({ message: 'Account is blocked or restricted.' });
        }

        // --- SECURITY OVERHAUL: REMOVED MASTER BYPASS LOGIC ---
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('❌ Auth Fail: Password Mismatch');
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT
        const payload = { user: { id: user._id, role: user.role } };
        
        const token = await new Promise((resolve, reject) => {
            jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret_key_12345', { expiresIn: '7d' }, (err, t) => {
                if (err) reject(err);
                resolve(t);
            });
        });

        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                fullName: user.fullName,
                email: user.email,
                emailVerified: user.emailVerified
            }
        });
    } catch (err) {
        console.error('Login Error:', err.stack);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.bindEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const userId = req.user.id || (req.user.user && req.user.user.id);

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and Security Code required' });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // 1. Verify OTP using the central EmailService
        const isValid = await EmailService.verifyOTP(normalizedEmail, otp, 'verification');
        if (!isValid) {
            return res.status(400).json({ message: 'Invalid or expired security code' });
        }

        // 2. Check if email already used by another account
        const existingUser = await User.findOne({ email: normalizedEmail, _id: { $ne: userId } });
        if (existingUser) {
            return res.status(400).json({ message: 'This email is already linked to another account' });
        }

        // 3. Update User
        const user = await User.findByIdAndUpdate(
            userId, 
            { email: normalizedEmail, emailVerified: true },
            { new: true }
        );

        res.json({
            message: 'Email linked and verified successfully',
            user: {
                id: user._id,
                email: user.email,
                emailVerified: user.emailVerified
            }
        });
    } catch (err) {
        console.error('Bind Email Error:', err.stack);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const userId = req.user.id || (req.user.user && req.user.user.id);

        const provisioningStatus = await PlanService.checkProvisioning(userId);
        if (provisioningStatus && provisioningStatus.status === 'active') {
            console.log(`[Server Sim] Plan Activated for User: ${userId}`);
        }

        const User = require('../user/UserModel');
        const redisConfig = require('../../config/redis');
        const cacheKey = `user_profile:${userId}`;
        let user = null;

        if (redisConfig.client.isOpen) {
            try {
                const cached = await redisConfig.client.get(cacheKey);
                if (cached) user = JSON.parse(cached);
            } catch (e) { }
        }

        if (!user) {
            user = await User.findById(userId).select('-password').lean();
            if (user && redisConfig.client.isOpen) {
                try {
                    // Profile/Balance data needs shorter TTL
                    await redisConfig.client.set(cacheKey, JSON.stringify(user), { EX: 60 });
                } catch (e) { }
            }
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userData = user;

        // [ARCHITECTURAL FIX] Single Source of Truth: wallet.*
        const wallet = user.wallet || {}; // DEFENSIVE CHECK

        userData.wallet_balance = wallet.main || 0;
        userData.income_balance = wallet.income || 0;
        userData.purchase_balance = wallet.purchase || 0;
        userData.game_balance = wallet.game || 0;

        // [CRITIAL] New 3-Wallet Structure Response
        userData.wallet = {
            main: wallet.main || 0,
            game: wallet.game || 0,
            income: wallet.income || 0,
            purchase: wallet.purchase || 0
        };

        // [SYNC] Frontend Obfuscated Access
        userData.w_dat = {
            m_v: wallet.main || 0,     // Main Value
            g_v: wallet.game || 0,     // Game Value
            i_v: wallet.income || 0,   // Income Value
            p_v: wallet.purchase || 0  // Purchase/Pro Value
        };

        userData.account_tier = user.taskData?.accountTier || 'Starter';
        userData.referral_code = user.referralCode;
        userData.kycStatus = user.kycStatus;
        userData.requireEmailVerification = !user.emailVerified;
        userData.tourSales = user.tourSales || 0;
        userData.purchaseCount = user.purchaseCount || 0;

        // --- NEW: Expose Detailed Active Plans & Progress (Appended AFTER Cache) ---
        const activePlans = await PlanService.getActivePlans(userId);
        
        userData.active_plans = activePlans.map(p => {
            // [SYNC] Handle daily reset logic for display consistency
            const now = new Date();
            const lastDate = p.last_earning_date ? new Date(p.last_earning_date) : new Date(0);
            const isToday = lastDate.getDate() === now.getDate() && lastDate.getMonth() === now.getMonth();
            
            return {
                id: p._id,
                planName: p.planName,
                syntheticPhone: p.syntheticPhone,
                tasksCompletedToday: isToday ? (p.tasksCompletedToday || 0) : 0,
                dailyLimit: p.dailyLimit,
                earnings_today: isToday ? (p.earnings_today || 0) : 0,
                serverIp: p.serverIp,
                serverLocation: p.serverLocation,
                expiryDate: p.expiryDate
            };
        });

        let minWithdrawalUsd = 5; // Global Default: $5
        if (activePlans && activePlans.length > 0) {
            const Plan = require('../admin/PlanModel');
            const planDetails = await Plan.findById(activePlans[0].planId);
            if (planDetails && planDetails.min_withdrawal) {
                minWithdrawalUsd = planDetails.min_withdrawal;
            }
        }
        userData.min_withdrawal_usd = minWithdrawalUsd; // Append to response

        userData.id = user._id;

        res.json(userData);
    } catch (err) {
        console.error(err);
        console.error('GetMe Error:', err);
        res.status(500).json({ message: 'Server Error', error: err.message, stack: err.stack });
    }
};

exports.getDynamicKey = async (req, res) => {
    try {
        const userId = req.user.id || (req.user.user && req.user.user.id);
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const key = `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;

        user.synthetic_phone = key;
        await user.save();

        res.json({ key });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.id || (req.user.user && req.user.user.id);
        const { oldPassword, newPassword, otp } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // [MANDATORY EMAIL SECURITY]
        // If user has a verified email, force OTP check for password changes
        if (user.email && user.emailVerified) {
            if (!otp) return res.status(400).json({ message: 'Password change requires email OTP verification.' });
            const isOtpValid = await EmailService.verifyOTP(user.email, otp, 'password_reset');
            if (!isOtpValid) return res.status(400).json({ message: 'Invalid or expired OTP code.' });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect old password' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: 'Password updated successfully' });

    } catch (err) {
        console.error('changePassword Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.setTransactionPin = async (req, res) => {
    try {
        const userId = req.user.id || (req.user.user && req.user.user.id);
        const { password, pin } = req.body;

        if (!pin || pin.length !== 6) {
            return res.status(400).json({ message: 'PIN must be 6 digits' });
        }

        const user = await User.findById(userId).select('+transactionPin');
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect account password' });
        }

        const salt = await bcrypt.genSalt(10);
        user.transactionPin = await bcrypt.hash(pin.toString(), salt);
        await user.save();

        res.json({ message: 'Transaction PIN set successfully' });
    } catch (err) {
        console.error('setTransactionPin Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.changeTransactionPin = async (req, res) => {
    try {
        const userId = req.user.id || (req.user.user && req.user.user.id);
        const { password, oldPin, newPin } = req.body;

        if (!newPin || newPin.length !== 6) {
            return res.status(400).json({ message: 'New PIN must be 6 digits' });
        }

        const user = await User.findById(userId).select('+transactionPin');
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect account password' });
        }

        const isPinMatch = await bcrypt.compare(oldPin.toString(), user.transactionPin);
        if (!isPinMatch) {
            return res.status(400).json({ message: 'Incorrect old PIN' });
        }

        const salt = await bcrypt.genSalt(10);
        user.transactionPin = await bcrypt.hash(newPin.toString(), salt);
        await user.save();

        res.json({ message: 'Transaction PIN changed successfully' });
    } catch (err) {
        console.error('changeTransactionPin Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- EMAIL & OTP ROUTES ---

exports.sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        // Basic format check
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        // Check if email already used
        if (req.body.context === 'registration') {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                if (existingUser.emailVerified === true) {
                    // Fully registered user — block re-registration
                    return res.status(400).json({ message: 'Email already in use' });
                } else {
                    // Partial/failed registration — clean it up and allow retry
                    console.log(`[sendOtp] Cleaning up partial registration for: ${email}`);
                    await User.deleteOne({ _id: existingUser._id });
                }
            }
        }

        const success = await EmailService.generateAndSendOTP(email, req.body.context || 'verification');
        if (success) {
            res.json({ message: 'OTP sent successfully' });
        } else {
            res.status(500).json({ message: 'Failed to send OTP' });
        }
    } catch (err) {
        console.error('Send OTP Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { email, otp, context } = req.body;
        if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });

        const isValid = await EmailService.verifyOTP(email, otp, context || 'verification');
        if (isValid) {
            res.json({ success: true, message: 'OTP verified successfully', verified: true });
        } else {
            res.status(400).json({ success: false, message: 'Invalid or expired OTP', verified: false });
        }
    } catch (err) {
        console.error('Verify OTP Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- LEGACY USER MIGRATION ---
exports.verifyLegacyEmail = async (req, res) => {
    try {
        const userId = req.user.id || (req.user.user && req.user.user.id);
        const { email, otp } = req.body;

        if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });

        // Verify OTP
        const isValid = await EmailService.verifyOTP(email, otp, 'verification');
        if (!isValid) return res.status(400).json({ message: 'Invalid or expired OTP' });

        // Check if email already belongs to another user
        const existing = await User.findOne({ email, _id: { $ne: userId } });
        if (existing) {
            return res.status(400).json({ message: 'This email is already registered to another account' });
        }

        // Update User
        const user = await User.findById(userId);
        user.email = email.toLowerCase();
        user.emailVerified = true;
        await user.save();

        res.json({ message: 'Email verified and updated successfully' });
    } catch (err) {
        console.error('Legacy Email Verify Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- FORGOT PASSWORD ---
exports.forgotPassword = async (req, res) => {
    try {
        const { identifier } = req.body; // Can be email or phone for old users, but we force email OTP
        if (!identifier) return res.status(400).json({ message: 'Email or Phone is required' });

        const isEmail = identifier.includes('@');
        let user;

        if (isEmail) {
            user = await User.findOne({ email: identifier.toLowerCase() });
        } else {
            const rawPhone = identifier.replace(/^\+88/, '');
            user = await User.findOne({ primary_phone: { $in: [rawPhone, `+88${rawPhone}`] } });
        }

        if (!user) return res.status(404).json({ message: 'User not found' });

        // If they don't have an email bound, we can't send them an OTP!
        if (!user.email) {
            return res.status(400).json({ message: 'No email bound to this account. Please contact support.' });
        }

        const success = await EmailService.generateAndSendOTP(user.email, 'password_reset');
        if (success) {
            res.json({ message: 'Password reset OTP sent to your email', email: user.email });
        } else {
            res.status(500).json({ message: 'Failed to send OTP email' });
        }
    } catch (err) {
        console.error('Forgot Password Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) return res.status(400).json({ message: 'All fields are required' });

        const isValid = await EmailService.verifyOTP(email, otp, 'password_reset');
        if (!isValid) return res.status(400).json({ message: 'Invalid or expired OTP' });

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: 'Password reset successfully. You can now login.' });
    } catch (err) {
        console.error('Reset Password Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};
