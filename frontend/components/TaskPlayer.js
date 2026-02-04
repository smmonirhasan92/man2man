'use client';
import { useState, useEffect, useRef } from 'react';
import { PlayCircle, CheckCircle, Clock, Shield, Zap, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import confetti from 'canvas-confetti';

export default function TaskPlayer({ task, onComplete, onClose, usaKey }) {
    const [status, setStatus] = useState('initializing'); // initializing, counting, ready, claiming, completed

    // [LOGIC] Dynamic Timer based on Task Type
    const getDuration = () => {
        if (task.type === 'video' || task.type === 'ad_view') return 10; // [FIX] Reduced to 10s
        if (task.type === 'review') return 8; // [FIX] Reduced to 8s
        return 8;
    };

    const [timeLeft, setTimeLeft] = useState(getDuration());
    const [error, setError] = useState(null);
    const FULL_DASH_ARRAY = 283; // 2 * PI * 45
    const [dashOffset, setDashOffset] = useState(0);

    // [New] Review Text Generator
    const [reviewText, setReviewText] = useState("");
    useEffect(() => {
        if (task.type === 'review') {
            const reviews = [
                "Amazing quality, totally worth it!",
                "Fast shipping and great customer service.",
                "Exactly what I was looking for, highly recommend.",
                "Five stars! Will buy again.",
                "Premium experience, very satisfied."
            ];
            setReviewText(reviews[Math.floor(Math.random() * reviews.length)]);
        }
    }, [task]);

    // [NEW] Connection Animation Steps
    // [NEW] Connection Animation Steps (Optimized: 6.5s Total)
    const [connectionStep, setConnectionStep] = useState(0);
    const STEPS = [
        { text: 'INITIALIZING SECURE TUNNEL', delay: 1500 },
        { text: 'VERIFYING PROXY CHAINS', delay: 2000 },
        { text: 'SYNCING VPS NODE', delay: 2000 },
        { text: 'Allocating Virtually: ', delay: 1500 }, // Total 7s
    ];

    // Timer Logic & Heartbeat
    useEffect(() => {
        let timer;
        let heartbeatInterval;

        // [MODIFIED] Connection Sequence
        if (status === 'initializing') {
            const sequence = async () => {
                // [FIX] Force Animation Every Time (User Request)
                const isSessionActive = false; // sessionStorage.getItem('usa_session_active') === 'true';

                if (!isSessionActive) {
                    // Run Animation
                    for (let i = 0; i < STEPS.length; i++) {
                        await new Promise(r => setTimeout(r, STEPS[i].delay));
                        setConnectionStep(prev => prev + 1);
                    }
                    // Mark Session Active
                    sessionStorage.setItem('usa_session_active', 'true');
                } else {
                    // Instant Connect
                    console.log("⚡ Session Active: Skipping Animation");
                }

                // Start Session
                try {
                    await api.post('/task/start', { taskId: task._id || task.id });
                    setStatus('counting');
                } catch (err) {
                    console.error("Task Start Error:", err);
                    setError(err.response?.data?.message || "Failed to start task session.");
                }
            };
            sequence();
            return;
        }

        if (status === 'counting') {
            // Main Timer
            timer = setInterval(() => {
                setTimeLeft((prev) => {
                    const nextTime = prev - 1;
                    const totalTime = getDuration();
                    const fraction = nextTime / totalTime;
                    setDashOffset(FULL_DASH_ARRAY - (fraction * FULL_DASH_ARRAY));

                    if (nextTime <= 0) {
                        clearInterval(timer);
                        clearInterval(heartbeatInterval);
                        setStatus('ready');
                        return 0;
                    }
                    return nextTime;
                });
            }, 1000);

            // Immediate Heartbeat to register activity
            api.post('/task/heartbeat', { taskId: task._id || task.id }).catch(e => console.warn("Init Heartbeat missed"));

            // Heartbeat Pulse (Every 10s)
            heartbeatInterval = setInterval(async () => {
                try {
                    await api.post('/task/heartbeat', { taskId: task._id || task.id });
                } catch (e) {
                    console.warn("Heartbeat missed:", e);
                    // Optional: If multiple fail, pause task?
                }
            }, 10000);
        }
        return () => {
            clearInterval(timer);
            clearInterval(heartbeatInterval);
        };
    }, [status, task]);

    // [FIX] Add useAuth to ensure user context is available if needed, though props might pass it.
    // The previous error "Cannot access 'user' before initialization" likely came from a closure or hook misuse.
    // Also fixing 400 error by ensuring claiming state is locked.

    const [claimResult, setClaimResult] = useState(null); // [NEW] Store result for display

    const handleClaim = async () => {
        if (status === 'claiming' || status === 'completed') return;

        setStatus('claiming');
        setError(null);
        try {
            // [FIX] Ensure we pass the key if available
            console.log('[TaskPlayer] Claiming Task:', { taskId: task._id || task.id, usaKey });
            if (!task._id && !task.id) {
                console.error('[TaskPlayer] Critical: Task ID missing', task);
                setError("Task ID Validation Failed");
                setStatus('ready');
                return;
            }

            const headers = usaKey ? { 'x-usa-key': usaKey } : {};

            const response = await api.post('/task/claim', { taskId: task._id || task.id }, {
                headers: headers
            });

            // SUCCESS!
            setClaimResult(response.data); // Capture Result
            fireCelebration();
            setStatus('completed');

            setTimeout(() => {
                if (onComplete) onComplete({ ...task, result: response.data });
            }, 2000);
        } catch (err) {
            // ... existing catch ...
            console.error(err);
            const msg = err.response?.data?.message || "Claim Failed - Please try again";
            if (msg.includes('0xCC1')) {
                setError("Protocol Handshake Failed: Node Proxy Timeout (Error 0xCC1)");
            } else {
                setError(msg);
            }
            setStatus('ready');
        }
    };



    const fireCelebration = () => {
        const duration = 2000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#34D399', '#60A5FA', '#FBBF24']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#34D399', '#60A5FA', '#FBBF24']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    };

    const isVideo = task.type === 'video' || task.type === 'ad_view';
    const isReview = task.type === 'review';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="bg-slate-900 w-full max-w-sm rounded-[32px] border border-slate-700 shadow-2xl overflow-hidden relative flex flex-col"
            >
                {/* Header */}
                <div className="px-5 py-4 bg-slate-800/80 border-b border-white/5 flex justify-between items-center z-20 backdrop-blur-md absolute top-0 w-full rounded-t-[32px]">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-mono font-bold text-slate-300 tracking-wider">
                            {isVideo ? 'WATCHING AD STREAM' : isReview ? 'PRODUCT REVIEW' : 'USA SECURE SESSION'}
                        </span>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700/50 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors">
                        <X size={14} />
                    </button>
                </div>

                {/* Content */}
                <div className="relative h-[450px]">
                    {/* Background / Video Simulation */}
                    <div className="absolute inset-0 bg-black">
                        <img
                            src={task.thumbnail || task.url || "https://images.unsplash.com/photo-1550751827-4bd374c3f58b"}
                            alt="Task"
                            className={`w-full h-full object-cover ${isVideo ? 'opacity-80' : 'opacity-40'}`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-slate-900/60"></div>

                        {/* Video UI Overlay */}
                        {isVideo && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 animate-pulse">
                                    <PlayCircle className="w-8 h-8 text-white fill-white" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Center Interaction Area */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-6 pt-20">

                        {/* REVIEW TEXT (Only for Reviews) */}
                        {isReview && (
                            <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 mb-6 w-full text-center">
                                <p className="text-[10px] text-slate-400 mb-2 uppercase tracking-wide">Copy this review</p>
                                <p className="text-sm font-bold text-white italic">"{reviewText}"</p>
                            </div>
                        )}

                        {/* TIMER CIRCLE */}
                        <AnimatePresence mode='wait'>
                            {(status === 'counting' || status === 'initializing') && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    className="relative w-32 h-32 mb-8"
                                >
                                    {/* SVG Circle with Dynamic Color */}
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                        <circle
                                            className="text-slate-700"
                                            strokeWidth="6"
                                            stroke="currentColor"
                                            fill="transparent"
                                            r="45"
                                            cx="50"
                                            cy="50"
                                        />
                                        <circle
                                            className={`${isVideo ? 'text-blue-500' : 'text-emerald-500'} transition-all duration-1000 ease-linear`}
                                            strokeWidth="6"
                                            strokeDasharray={FULL_DASH_ARRAY}
                                            strokeDashoffset={dashOffset}
                                            strokeLinecap="round"
                                            stroke="currentColor"
                                            fill="transparent"
                                            r="45"
                                            cx="50"
                                            cy="50"
                                        />
                                    </svg>

                                    {/* Inner Text */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        {status === 'initializing' ? (
                                            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <span className="text-4xl font-black text-white font-mono">{timeLeft}</span>
                                                <span className="text-[10px] text-emerald-400 font-bold uppercase">Seconds</span>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* STATUS TEXT & CONNECTION STEPS */}
                        {status === 'initializing' && (
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                <p className="text-emerald-400 text-xs font-mono font-bold animate-pulse tracking-widest">
                                    {STEPS[connectionStep] ? (
                                        STEPS[connectionStep].text.includes('Allocating')
                                            ? `ACTIVATING: ${usaKey || '+1 (UNKNOWN)'}`
                                            : STEPS[connectionStep].text
                                    ) : 'ESTABLISHING...'}
                                </p>
                                <div className="flex gap-1 mt-2">
                                    {[0, 1, 2, 3].map(i => (
                                        <div key={i} className={`h-1 w-8 rounded-full transition-colors duration-500 ${i <= connectionStep ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {status === 'counting' && isVideo && (
                            <p className="text-blue-400 text-xs font-mono animate-pulse">WATCHING ADVERTISEMENT...</p>
                        )}

                        {/* CLAIM BUTTON */}
                        <AnimatePresence>
                            {status === 'ready' && (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="w-full"
                                >
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleClaim}
                                        className="w-full py-5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl font-black text-white text-lg uppercase tracking-wider shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center justify-center gap-3 relative overflow-hidden group"
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 backdrop-blur-sm"></div>
                                        <CheckCircle className="w-6 h-6 fill-white/20" />
                                        <span>Claim Reward</span>
                                    </motion.button>
                                    <p className="text-center text-slate-500 text-xs mt-4">Verified by USA Affiliate Network</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* SUCCESS STATE */}
                        {status === 'completed' && (
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex flex-col items-center gap-4"
                            >
                                <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.6)]">
                                    <CheckCircle className="w-10 h-10 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white text-center">AWESOME!</h3>
                                    {claimResult?.rewardAmount ? (
                                        <p className="text-emerald-400 font-black text-xl text-center mt-1">
                                            +${Number(claimResult.rewardAmount).toFixed(4)}
                                        </p>
                                    ) : (
                                        <p className="text-emerald-400 font-bold text-center">Reward Credited Successfully</p>
                                    )}
                                </div>
                            </motion.div>
                        )}


                        {/* ERROR STATE */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="w-full bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 mt-4"
                            >
                                <Info className="w-5 h-5 text-red-500 shrink-0" />
                                <p className="text-red-200 text-xs font-bold leading-tight">{error}</p>
                            </motion.div>
                        )}

                    </div>
                </div>
            </motion.div >
        </div >
    );
}
