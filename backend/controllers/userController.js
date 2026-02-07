const User = require('../modules/user/UserModel');
const Transaction = require('../modules/wallet/TransactionModel');
const AccountTier = require('../modules/settings/AccountTierModel');
const Plan = require('../modules/admin/PlanModel'); // Added Plan Model
// const Wallet = require('../models/Wallet'); // Embedded
// const AuditLog = require('../models/AuditLog'); // Need generic log
const mongoose = require('mongoose');

// Helper for Tier Config (using SystemSettings or Hardcoded for now)
const TIER_PRICES = {
    'Starter': 0,
    'Silver': 1000,
    'Gold': 5000,
    'Platinum': 10000,
    'Diamond': 25000
};

// Upgrade Account Tier
exports.upgradeAccountTier = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = req.user.user.id;
        const { planId } = req.body;

        // Fetch Plan from DB
        const plan = await Plan.findById(planId);
        if (!plan) {
            throw new Error('Invalid Plan');
        }

        const price = plan.unlock_price;
        const planName = plan.name;

        const user = await User.findById(userId).session(session);
        if (!user) throw new Error('User not found');

        const purchaseBal = user.wallet.purchase || 0;
        const mainBal = user.wallet.main || 0;

        if ((purchaseBal + mainBal) < price) {
            throw new Error('Insufficient Balance');
        }

        let remainingCost = price;

        // Dedjuct from Purchase Wallet
        if (purchaseBal >= remainingCost) {
            user.wallet.purchase -= remainingCost;
            remainingCost = 0;
        } else {
            remainingCost -= purchaseBal;
            user.wallet.purchase = 0;
        }

        // Deduct Remainder from Main
        if (remainingCost > 0) {
            user.wallet.main -= remainingCost;
        }

        user.taskData.accountTier = planName;
        await user.save({ session });

        // Log
        await new Transaction({
            userId: user._id,
            type: 'purchase',
            amount: -price,
            status: 'completed',
            description: `Upgraded to ${planName}`
        }).save({ session });

        await session.commitTransaction();
        res.json({ success: true, message: `Upgraded to ${planName}`, newTier: planName });
    } catch (err) {
        await session.abortTransaction();
        console.error(err);
        res.status(500).json({ message: err.message || 'Server Error' });
    } finally {
        session.endSession();
    }
};

// Get Available Plans
exports.getAccountPlans = async (req, res) => {
    try {
        const plans = await Plan.find({ is_active: true }).sort({ unlock_price: 1 });
        res.json(plans);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.uploadProfilePhoto = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        const userId = req.user.user.id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.photoUrl = `/uploads/${req.file.filename}`;
        await user.save();
        res.json({ message: 'Profile photo uploaded', photoUrl: user.photoUrl });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get All Users (Admin) - with Search & Pagination
exports.getAllUsers = async (req, res) => {
    try {
        const { search, page = 1, limit = 20 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        let query = {};

        if (search) {
            const searchRegex = new RegExp(search, 'i'); // Case-insensitive
            query = {
                $or: [
                    { fullName: searchRegex },
                    { username: searchRegex },
                    { email: searchRegex },
                    { primary_phone: searchRegex }, // [FIX] Updated to match Schema
                    { synthetic_phone: searchRegex } // [FIX] Allow searching by US Phone
                ]
            };
        }

        const users = await User.find(query, '-password')
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum);

        const total = await User.countDocuments(query);

        res.json({
            users: users.map(u => ({ ...u.toObject(), id: u._id })),
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (err) {
        console.error("GetAllUsers Error:", err);
        res.status(500).json({ message: 'Server Error', error: err.message, stack: err.stack });
    }
};

// Update User Role (Admin)
exports.updateUserRole = async (req, res) => {
    try {
        const { userId, role } = req.body;
        const validRoles = ['super_admin', 'employee_admin', 'agent', 'user'];
        if (!validRoles.includes(role)) return res.status(400).json({ message: 'Invalid role' });

        const user = await User.findByIdAndUpdate(userId, { role }, { new: true });
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({ message: 'User role updated', user });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Update User Profile (Self)
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.user.id;
        const { fullName } = req.body;
        const update = {};
        if (fullName) update.fullName = fullName;
        if (req.file) update.photoUrl = req.file.path;

        const user = await User.findByIdAndUpdate(userId, update, { new: true });
        res.json({ message: 'Profile updated', user });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Change Password
exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.user.id;
        const { oldPassword, newPassword } = req.body;
        const bcrypt = require('bcryptjs');

        const user = await User.findById(userId); // Need password field
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Incorrect old password' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Admin Reset Password
exports.adminResetPassword = async (req, res) => {
    try {
        const { userId, newPassword } = req.body;
        const bcrypt = require('bcryptjs');

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: `Password reset for user ${user.username}` });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get My Referrals (Tree Data)
exports.getMyReferrals = async (req, res) => {
    try {
        const userId = req.user.user.id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const referrals = await User.find({ referredBy: user.referralCode }).select('username fullName createdAt role taskData');

        // Map to Tree Structure (Simple Level 1 for now, can be recursive later)
        const children = referrals.map(ref => ({
            id: ref._id,
            name: ref.fullName,
            username: ref.username,
            joinDate: ref.createdAt,
            tier: ref.taskData?.accountTier || 'Starter',
            isActive: ref.status === 'active'
        }));

        res.json({
            name: user.fullName,
            username: user.username,
            totalReferrals: children.length,
            children: children
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};
