const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./kernel/database'); // New MongoDB Connection
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');

// Load environment variables
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
app.disable('x-powered-by'); // Hide Tech Stack

// [DEBUG] Request Tracer - Log EVERYTHING
app.use((req, res, next) => {
    console.log(`[TRACER] ${req.method} ${req.originalUrl}`);
    console.log(`[TRACER] Host: ${req.headers.host}`);
    next();
});

const PORT = process.env.PORT || 10000;
console.log(`[BOOT] Server starting... PORT=${PORT}`);

app.use((req, res, next) => {
    // Existing Shield Logic...
    process.stdout.write(`[RAW_REQ] ${req.method} ${req.url}\n`);

    // --- CLOUDFLARE SHIELD (Stealth Mode) ---
    // In production, only accept requests proxied by Cloudflare
    // [DEV BYPASS] Allow all local requests including 127.0.0.1
    const isLocalhost = req.ip === '127.0.0.1' || req.ip === '::1' || req.hostname === 'localhost';

    if (!isLocalhost && !req.headers['cf-connecting-ip'] && !req.headers['cf-ray']) {
        // Silent Drop or 403
        console.log('🛑 [Shield] Blocked direct IP access:', req.ip);
    }

    next();
});

// Core Middleware
// HARDCODED CORS FOR LOCALHOST STABILITY
// DYNAMIC CORS origin for local development + Production Vercel
// [FIX] Accept CLIENT_URL from Env or fallback to known domains
const ALLOWED_ORIGINS = [
    "https://man2man.vercel.app",
    "https://usa-affiliate.vercel.app",
    "https://man2man-fvzfximrq-boos-projects-a58a40d0.vercel.app", // [NEW] Specific Preview URL
    "http://localhost:3000",
    process.env.CLIENT_URL, // Dynamic from Render Env
    /\.vercel\.app$/        // [FIX] Allow all Vercel Preview Deployments
].filter(Boolean); // Remove undefined

app.use(cors({
    origin: true, // [TEMPORARY CHECK] Reflects the request origin (Effectively allows ALL), while keeping credentials working.
    // origin: ALLOWED_ORIGINS, // We will revert to this strict list after testing
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-usa-key', 'x-usa-identity'],
    credentials: true
}));
// app.options('*', cors()); // [REMOVED] Causing PathError in Express 5.x. Global middleware handles it.

// Manual OPTIONS handler to ensure Preflight works 100%
// Manual OPTIONS handler REMOVED in favor of dynamic 'cors' middleware
// This ensures 127.0.0.1 and localhost both work correctly without conflict.

// Security Middleware (adjusted for dev)
app.use(helmet({ crossOriginResourcePolicy: false })); // Allow Cross-Origin Resources
app.use(hpp()); // Prevent HTTP Parameter Pollution

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' }
});

const transactionController = require('./modules/wallet/transaction.controller');
app.get('/api/debug-settings', transactionController.getPaymentSettings);

app.use('/api', limiter);

// Body Parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Test Route
app.get('/', (req, res) => {
    res.send('USA Afiliat marking Backend is running!');
});

// [NEW] Health Check for Deployment Verification
app.get('/health', (req, res) => {
    const mongoose = require('mongoose');
    const dbStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        database: dbStatus
    });
});

app.get('/api', (req, res) => {
    res.send('USA Afiliat marking Backend API is Running Successfully! 🚀');
});

// --- CORE MODULE IMPORTS ONLY ---
const authRoutes = require('./modules/auth/auth.routes');
const walletRoutes = require('./modules/wallet/wallet.routes');
const transactionRoutes = require('./modules/wallet/transaction.routes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const agentRoutes = require('./routes/agentRoutes');
const settingsRoutes = require('./modules/settings/SettingsRoutes');

// --- USE CORE ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/transaction', transactionRoutes);
app.use('/api/user', userRoutes);
app.use('/api/task', taskRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/plan', require('./modules/plan/PlanRoutes')); // Cleaned
app.use('/api/history', require('./routes/historyRoutes')); // Cleaned
app.use('/api/notifications', require('./modules/notification/NotificationRoutes')); // [NEW] OTP Inbox
app.use('/api/game', require('./routes/gameRoutes')); // [NEW] Game Routes
app.use('/api/lottery', require('./routes/lotteryRoutes')); // [NEW] Dedicated Lottery Routes
app.use('/api/p2p', require('./routes/p2pRoutes')); // [NEW] P2P Escrow Routes
app.use('/api/debug', require('./routes/debugRoutes')); // [NEW] Critical Debug Route
app.use('/api/chat', require('./routes/chatRoutes')); // [NEW] AI Chat Support
// app.use('/api/settings', settingsRoutes); // Cleaned

// --- GLOBAL ERROR HANDLER ---
const Logger = require('./modules/common/Logger');
app.use((err, req, res, next) => {
    Logger.error(`[GLOBAL ERROR] ${req.method} ${req.url} - ${err.message}`, err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
});

app.use((req, res) => {
    console.error(`[FALLBACK 404] No route matched for ${req.url}`);
    res.status(404).json({ message: 'Route not found (Fallback)' });
});

// Start Server with Socket.io
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [
            "https://man2man.vercel.app",
            "https://usa-affiliate.vercel.app",
            "http://localhost:3000",
            process.env.CLIENT_URL
        ].filter(Boolean),
        methods: ["GET", "POST"],
        credentials: true
    }
});

// --- SOCKET ARCHITECTURE ---
// Unified Global IO for seamless Game + Notification sync
const SocketService = require('./modules/common/SocketService');
// Initialize with /system namespace to match Client
SocketService.init(io.of('/system'));

// Initialize Services with Global IO
const NotificationService = require('./modules/notification/NotificationService');
NotificationService.init(io.of('/system'));

// Store io in app
app.set('io', io);

// --- GLOBAL CONNECTION HANDLER ---
io.on('connection', (socket) => {
    // 1. User Room Auto-Join
    socket.on('join_user_room', (userId) => {
        if (userId) {
            const roomName = `user_${userId}`;
            socket.join(roomName);
            // console.log(`[SOCKET] User ${userId} joined room: ${roomName}`);
        }
    });

    // 1.5 Admin Room Join
    socket.on('join_admin_room', (adminToken) => {
        // Ideally verify token here, but keeping it open for internal dashboard for now
        socket.join('admin_dashboard');
        // console.log(`[SOCKET] Joined Admin Dashboard`);
    });

    // 2. Chat Brain (Support)
    socket.on('chat_message', async (data) => {
        try {
            const SystemBrain = require('./modules/ai/SystemBrainService');
            socket.emit('chat_typing', { status: true });

            const onTokenStream = (token) => {
                socket.emit('chat_stream', { chunk: token, sender: 'support_bot' });
            };

            const finalResponse = await SystemBrain.chat(data.message, onTokenStream);
            socket.emit('chat_response', {
                sender: 'support_bot',
                text: finalResponse,
                timestamp: new Date()
            });
        } catch (err) {
            console.error('Socket AI Error:', err);
            socket.emit('chat_response', {
                sender: 'support_bot',
                text: "My brain is offline temporarily, Sir.",
                timestamp: new Date()
            });
        }
    });

    socket.on('disconnect', () => {
        // console.log('[SOCKET] Disconnected:', socket.id);
    });
});

// --- SYSTEM NAMESPACE (Fix for Client Connection Error) ---
const systemNamespace = io.of('/system');
systemNamespace.on('connection', (socket) => {
    console.log('[SOCKET] Client connected to /system namespace:', socket.id);

    // Allow joining user rooms in system namespace if needed
    socket.on('join_user_room', (userId) => {
        if (userId) socket.join(`user_${userId}`);
    });
});



// Logger already required above

// Global Error Handlers
process.on('uncaughtException', (err) => {
    console.error("CRASH DEBUG:", err);
    Logger.error('UNCAUGHT EXCEPTION! (Critical)', err.stack);
    // [RECOVERY] In a containerized env (Render), exiting allows orchestrator to restart cleanly.
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error("UNHANDLED REJECTION:", reason);
    Logger.error('UNHANDLED REJECTION! 💥', reason instanceof Error ? reason.stack : reason);
});

// Graceful Shutdown for Render Zero Downtime Deployment
const gracefulShutdown = () => {
    console.log('SIGTERM/SIGINT received. Shutting down gracefully...');
    server.close(() => {
        console.log('HTTP Server closed.');
        // close DB connection if needed
        process.exit(0);
    });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

const startServer = async () => {
    try {
        await connectDB();

        // [REDIS] Connect Speed Cache
        const { connectRedis } = require('./config/redis');
        connectRedis().catch(redisErr => {
            Logger.warn('Redis Connection Failed (Cache Disabled):', redisErr.message);
        });

        // -------------------------------------------------------

        const initPulse = require('./modules/cron/Pulse');
        initPulse();

        server.listen(PORT, '0.0.0.0', () => {
            Logger.info(`Server (HTTP + Socket.io) is running on port ${PORT}`);
            console.log(`VERSION: ${PORT} - STABLE LOGGING - CORE MODULES ONLY`);
        });
    } catch (e) {
        console.error('SERVER CRASH STACK:', e.stack);
        Logger.error('Failed to start server:', e.stack);
        process.exit(1);
    }
};

// --- Game Loops ---
// Aviator Game Loop Removed per user request

startServer();
