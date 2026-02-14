'use client';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Trophy, Timer, Zap, Target, Ticket } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmationModal from '../../components/ui/ConfirmationModal';


export default function PremiumLottery({ tier = 'INSTANT', initialData = null }) {
    const PRICE_MAP = {
        'STARTER': 10,
        'TIER_30M': 20, 'BASIC': 20,
        'TIER_1H': 30, 'BRONZE': 30,
        'TIER_6H': 40, 'SILVER': 40,
        'TIER_12H': 50, 'GOLD': 50,
        'TIER_10M': 15, // Explicit pricing for new standard
        'TIER_24H': 80, 'PLATINUM': 80,
        'TIER_3D': 100,
        'TIER_7D': 120, 'DIAMOND': 120
    };

    const [jackpot, setJackpot] = useState(initialData?.jackpot || 0);
    const [nextDraw, setNextDraw] = useState(initialData?.endTime || null);
    const [progress, setProgress] = useState(initialData?.progress || 0);
    const [myTickets, setMyTickets] = useState(0);
    // Initialize price based on Tier immediately for optimistic UI
    const [ticketPrice, setTicketPrice] = useState(PRICE_MAP[tier] || 20);
    const [loading, setLoading] = useState(false);
    const [showDrum, setShowDrum] = useState(false);
    const [slotId, setSlotId] = useState(initialData?.slotId || null);
    const [prizes, setPrizes] = useState(initialData?.prizes || []);
    const [showPrizeList, setShowPrizeList] = useState(false);
    const [status, setStatus] = useState(initialData?.status || 'ACTIVE');
    const [timeOffset, setTimeOffset] = useState(0); // [SYNC] Server Time - Local Time
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
    const socket = useSocket(); // Defaults to /system

    // Initial Data Fetch if not provided
    useEffect(() => {
        setTicketPrice(PRICE_MAP[tier] || 20); // Force update price on tab change
        if (!initialData) fetchData();
        else {
            setJackpot(initialData.jackpot);
            setProgress(initialData.progress);
            setSlotId(initialData.slotId);
            setNextDraw(initialData.endTime);
            setPrizes(initialData.prizes || []);
        }
    }, [initialData, tier]);

    const fetchData = async () => {
        try {
            const statusRes = await api.get(`/lottery/active?tier=${tier}`);
            const data = statusRes.data;
            if (data && data.status !== 'INACTIVE') {
                setJackpot(data.jackpot);
                setNextDraw(data.endTime);
                setProgress(data.progress || 0);
                setSlotId(data.slotId);
                setPrizes(data.prizes || []);
                setSlotId(data.slotId);
                setPrizes(data.prizes || []);
                if (data.ticketPrice) setTicketPrice(Number(data.ticketPrice));

                // [SYNC] Calculate Time Offset
                if (data.serverTime) {
                    const serverTime = new Date(data.serverTime).getTime();
                    const localTime = new Date().getTime();
                    setTimeOffset(serverTime - localTime);
                }

                setStatus(data.status); // Sync status

                // [FIX] Resume Animation Logic
                // If status is DRAWING, we do NOT auto-show drum on load.
                // We just let the UI reflect the status (e.g. "Watch Draw" button).
                if (data.status === 'DRAWING') {
                    // No auto-trigger. Button will handle it.
                }

                // Fetch tickets
                const ticketRes = await api.get('/lottery/my-tickets');
                if (Array.isArray(ticketRes.data)) {
                    // Count only ACTIVE or PENDING tickets for the badge
                    const activeCount = ticketRes.data.filter(t => t.status === 'ACTIVE' || t.status === 'PENDING').length;
                    setMyTickets(activeCount);
                } else {
                    setMyTickets(Number(ticketRes.data.count) || 0); // Fallback if API structure differs
                }
            } else {
                setSlotId(null); // No active slot
            }
        } catch (e) {
            // Silently fail on network error to prevent UI crash, but log for debug
            // console.warn("Lottery Data Unavailable");
            setSlotId(null);
        }
    };

    // Socket Listeners
    useEffect(() => {
        if (!socket) return;

        const onUpdate = (data) => {
            if (data.tier === tier) {
                setJackpot(data.jackpot);
                setNextDraw(data.endTime);
                setSlotId(data.slotId);
                setPrizes(data.prizes || []);
                if (data.targetSales > 0) {
                    const prog = Math.min((data.currentSales / data.targetSales) * 100, 100);
                    setProgress(prog);
                }
                if (data.status) setStatus(data.status); // [FIX] Real-time Status Sync
            }
        };

        const onDrawStart = (data) => {
            if (data.slotId === slotId) {
                // LIVE EVENT: Auto-trigger animation for everyone watching
                setShowDrum(true);
                setTimeout(() => {
                    setShowDrum(false);
                    fetchData();
                }, data.duration || 7000);
            }
        };

        const onWin = (data) => {
            if (data.slotId === slotId) {
                setShowDrum(false); // [FIX] Ensure drum stops immediately on win
                fetchData();
                import('canvas-confetti').then((confetti) => {
                    confetti.default({
                        particleCount: 150,
                        spread: 70,
                        origin: { y: 0.6 },
                        disableForReducedMotion: true,
                        zIndex: 2000 // Above modals
                    });
                }).catch(e => console.warn("Confetti skipped", e));
            }
        };

        socket.on('LOTTERY_UPDATE', onUpdate);
        socket.on('LOTTERY_DRAW_START', onDrawStart);
        socket.on('LOTTERY_WIN_MULTI', onWin);

        return () => {
            socket.off('LOTTERY_UPDATE', onUpdate);
            socket.off('LOTTERY_DRAW_START', onDrawStart);
            socket.off('LOTTERY_WIN_MULTI', onWin);
        };
    }, [tier, slotId]);

    const buyTicket = async (isConfirmed = false) => {
        if (!isConfirmed) {
            setConfirmModal({
                isOpen: true,
                title: 'Confirm Purchase',
                message: `Are you sure you want to buy a ticket for ${tier}? It will cost ${ticketPrice} TK.`,
                onConfirm: () => buyTicket(true)
            });
            return;
        }

        setLoading(true);
        try {
            await api.post('/lottery/buy', { lotteryId: slotId });
            toast.success("Ticket Purchased!", {
                style: { background: '#0a192f', color: '#fff', border: '1px solid #3b82f6' },
                iconTheme: { primary: '#3b82f6', secondary: '#fff' }
            });
            setMyTickets(prev => prev + 1);
        } catch (e) {
            const msg = e.response?.data?.message || e.response?.data?.error || 'Purchase Failed';
            if (msg.includes('Draw Locked') || msg.includes('Pulse Calculation')) {
                toast('⚠️ Ticket sales are closed for this round! Please join the next draw.', {
                    icon: '🔒',
                    style: { background: '#333', color: '#fff', border: '1px solid #facc15' }
                });
            } else {
                toast.error(msg, {
                    style: { background: '#1e1e1e', color: '#ef4444', border: '1px solid #7f1d1d' }
                });
            }
        } finally {
            setLoading(false);
        }
    };

    // Countdown Logic
    const [timeLeft, setTimeLeft] = useState('');
    useEffect(() => {
        if (!nextDraw) {
            setTimeLeft('LIVE');
            return;
        }
        const interval = setInterval(() => {
            const now = new Date().getTime() + timeOffset; // [SYNC] Adjust with offset
            const end = new Date(nextDraw).getTime();
            const dist = end - now;

            if (dist < 0) {
                setTimeLeft('DRAWING...');
            } else {
                const h = Math.floor((dist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const m = Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((dist % (1000 * 60)) / 1000);
                setTimeLeft(`${h}h ${m}m ${s}s`);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [nextDraw]);


    // Theme Config
    const theme = {
        FLASH: { color: 'red', icon: Zap, label: 'FLASH DRAW' },
        HOURLY: { color: 'blue', icon: Timer, label: 'HOURLY JACKPOT' },
        MEGA: { color: 'purple', icon: Trophy, label: 'MEGA MILLIONS' },
        INSTANT: { color: 'emerald', icon: Target, label: 'INSTANT WIN' },

        // V2 Tiers
        TIER_10M: { color: 'blue', icon: Zap, label: '10 MINUTE FLASH' },
        TIER_30M: { color: 'emerald', icon: Timer, label: '30 MINUTE DRAW' },
        TIER_1H: { color: 'amber', icon: Trophy, label: 'HOURLY DRAW' },
        TIER_6H: { color: 'yellow', icon: Trophy, label: '6 HOUR DRAW' },
        TIER_12H: { color: 'orange', icon: Trophy, label: '12 HOUR DRAW' },
        TIER_24H: { color: 'cyan', icon: Trophy, label: 'DAILY JACKPOT' },
        TIER_3D: { color: 'purple', icon: Trophy, label: '3 DAY SPECIAL' },
        TIER_7D: { color: 'red', icon: Trophy, label: 'WEEKLY MEGA' }
    }[tier] || { color: 'emerald', icon: Trophy, label: 'LOTTERY' };

    const Icon = theme.icon;

    // [UNIVERSAL] Phase Logic: Switch to "WATCH" mode in last 60 seconds
    const getTimeDiff = () => {
        if (!nextDraw) return 100000;
        const now = new Date().getTime() + timeOffset;
        return new Date(nextDraw).getTime() - now;
    };

    // [Cycle Update] Universal Cycle with 60s Lock
    const diff = getTimeDiff();
    const lockThreshold = 60000; // Standard 60s for all

    // STRICT Logic: Open if > 60s
    // Locked if < 60s
    const isOpenPhase = diff > 60000;
    const isLockedPhase = diff > 0 && diff <= 60000;

    const isPhaseLocked = timeLeft !== 'LIVE' && isLockedPhase;
    const effectiveLock = !isOpenPhase; // If not open, it's locked (or drawing/live)

    // Override Status for UI if Open
    const effectiveStatus = isOpenPhase ? 'ACTIVE' : status;

    // [Visual] Show "ENTRIES CLOSING SOON" if between 60s and 90s (optional) or just rely on Lock
    // User requested: "From 0:00 to 1:59: Display JOIN... From 2:00 to 3:00 (3rd Minute): Switch to WATCH"
    // So distinct UI needed? "WATCH DRAW" appears when Locked.
    // We already have `isPhaseLocked` showing "WATCH DRAW" button.

    const isUrgentOpen = false; // Disable special "LIVE ENTRIES OPEN" since we have a normal 2m window now

    if (!slotId) return (
        <div className="bg-[#111] rounded-xl p-6 border border-white/5 text-center flex flex-col items-center justify-center h-64">
            <Icon className={`w-12 h-12 text-${theme.color}-500 mb-4 opacity-50`} />
            <h3 className="text-slate-400 font-bold">No Active {theme.label}</h3>
            <p className="text-xs text-slate-600 mt-2">Check back later or auto-create in Admin.</p>
        </div>
    );

    return (
        <div className="relative w-full max-w-md mx-auto perspective-1000">
            {/* Same styles ... */}
            <style jsx>{`
                @keyframes smoke {
                    0% { transform: translateY(0) scale(1); opacity: 0; }
                    50% { opacity: 0.6; }
                    100% { transform: translateY(-50px) scale(2); opacity: 0; }
                }
                .smoke-particle {
                    position: absolute;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 70%);
                    animation: smoke 2s infinite ease-out;
                    filter: blur(5px);
                }
             `}</style>

            {/* DRUM OVERLAY (AnimatePresence for Exit Animation) */}
            <AnimatePresence>
                {showDrum && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.2 }}
                        className="absolute inset-0 z-50 bg-black/90 rounded-2xl flex flex-col items-center justify-center backdrop-blur-sm"
                    >
                        {/* ... same drum UI ... */}
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="smoke-particle" style={{ left: `${40 + i * 5}%`, bottom: '40%', animationDelay: `${i * 0.2}s` }}></div>
                        ))}

                        <motion.div
                            animate={{ rotateX: [0, 360 * 5] }}
                            transition={{ duration: 3, ease: "easeOut" }}
                            className="text-6xl mb-4 relative z-10"
                        >
                            🎰
                        </motion.div>
                        <div className={`text-${theme.color}-500 font-black text-3xl animate-pulse drop-shadow-[0_0_15px_rgba(var(--${theme.color}-rgb),0.8)] relative z-10`}>
                            DRAWING...
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* PRIZE MODAL (Keep Existing) */}
            <AnimatePresence>
                {showPrizeList && (
                    // ... same ...
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={() => setShowPrizeList(false)}
                        className="absolute inset-0 z-40 bg-black/90 rounded-2xl flex flex-col items-center justify-center backdrop-blur-md p-4"
                    >
                        {/* ... content ... */}
                        <div className="w-full max-w-sm bg-[#0a192f] border border-blue-500/30 rounded-xl p-6 shadow-2xl relative overflow-hidden text-center" onClick={e => e.stopPropagation()}>
                            {/* USA Theme Bg Effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-red-900/20 pointer-events-none"></div>

                            <h3 className="text-xl font-black text-white uppercase tracking-widest mb-4 flex justify-center items-center gap-2 relative z-10">
                                <Trophy className="w-5 h-5 text-yellow-500" /> Prize Pool
                            </h3>

                            <div className="space-y-3 relative z-10 max-h-[300px] overflow-y-auto">
                                {prizes && prizes.length > 0 ? prizes.map((p, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition">
                                        <div className="text-left">
                                            <div className="text-xs text-slate-400 uppercase font-bold">{p.name}</div>
                                            <div className="text-[10px] text-slate-500">{p.winnersCount} Winner{p.winnersCount > 1 ? 's' : ''}</div>
                                        </div>
                                        <div className="text-yellow-500 font-mono font-bold text-lg">
                                            {p.amount.toLocaleString()} NXS
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-slate-500 text-sm">Main Jackpot Only</div>
                                )}
                            </div>

                            <button
                                onClick={() => setShowPrizeList(false)}
                                className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg uppercase tracking-wider text-xs transition relative z-10"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* GOLDEN CARD CONTAIENR */}
            <motion.div
                layoutId={`lottery-card-${tier}`}
                className={`relative bg-[#050505] rounded-3xl p-[1px] shadow-[0_0_30px_-5px_rgba(var(--${theme.color}-rgb),0.3)] overflow-hidden group`}
            >
                {/* CSS Animated Border Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br from-${theme.color}-500 via-transparent to-${theme.color}-900 opacity-50 group-hover:opacity-100 transition duration-1000`}></div>

                {/* Inner Card */}
                <div className="bg-[#0a0a0a] rounded-[23px] p-6 relative z-10 h-full flex flex-col justify-between">

                    {/* Header: Tier Label & Timer */}
                    <div className="flex justify-between items-start mb-8">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-xl bg-gradient-to-br from-${theme.color}-500/20 to-black border border-${theme.color}-500/30 shadow-[inset_0_0_10px_rgba(var(--${theme.color}-rgb),0.2)]`}>
                                <Icon className={`w-6 h-6 text-${theme.color}-400 drop-shadow-[0_0_8px_rgba(var(--${theme.color}-rgb),1)]`} />
                            </div>
                            <div>
                                <h3 className={`font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 text-xl tracking-wider select-none uppercase`}>
                                    {theme.label}
                                </h3>
                                {/* Prize Range Badge */}
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                                    Winning:
                                    <span className="text-yellow-500 font-bold">৳{prizes.length > 0 ? Math.min(...prizes.map(p => p.amount)).toLocaleString() : jackpot.toLocaleString()}</span>
                                    <span className="text-slate-600">-</span>
                                    <span className="text-yellow-500 font-bold">৳{prizes.length > 0 ? Math.max(...prizes.map(p => p.amount)).toLocaleString() : jackpot.toLocaleString()}</span>
                                </div>

                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`relative flex h-2 w-2`}>
                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-${theme.color}-400 opacity-75`}></span>
                                        <span className={`relative inline-flex rounded-full h-2 w-2 bg-${theme.color}-500`}></span>
                                    </span>
                                    <span className={`text-[10px] font-bold text-${theme.color}-400 uppercase tracking-widest`}>
                                        {effectiveStatus === 'DRAWING' ? 'DRAWING NOW' : (timeLeft === 'LIVE' ? 'LIVE NOW' : (isOpenPhase ? 'STATUS: OPEN FOR ENTRIES' : timeLeft))}
                                        {isPhaseLocked && <span className="ml-2 text-red-500 animate-pulse">(Locked)</span>}
                                    </span>
                                </div>

                                {/* NEW: Prize Metrics */}
                                <div className="grid grid-cols-3 gap-2 mt-4 w-full">
                                    <div className="bg-black/40 border border-white/5 rounded px-2 py-1.5 flex flex-col items-center justify-center">
                                        <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Jackpot</span>
                                        <span className="text-yellow-400 font-mono font-bold text-xs">
                                            ৳{prizes.length > 0 ? Math.max(...prizes.map(p => p.amount)).toLocaleString() : jackpot.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="bg-black/40 border border-white/5 rounded px-2 py-1.5 flex flex-col items-center justify-center">
                                        <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Min Prize</span>
                                        <span className="text-emerald-400 font-mono font-bold text-xs">
                                            ৳{prizes.length > 0 ? Math.min(...prizes.map(p => p.amount)).toLocaleString() : '0'}
                                        </span>
                                    </div>
                                    <div className="bg-black/40 border border-white/5 rounded px-2 py-1.5 flex flex-col items-center justify-center">
                                        <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Winners</span>
                                        <span className="text-white font-mono font-bold text-xs">
                                            {prizes.length > 0 ? prizes.length : 1}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Jackpot Display (Golden Glow) */}
                    <div className="text-center mb-8 relative py-4">
                        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-16 bg-${theme.color}-500/5 blur-3xl rounded-full pointer-events-none"></div>
                        <div className="flex justify-center items-center gap-2 mb-2 cursor-pointer group/prize" onClick={() => setShowPrizeList(true)}>
                            <div className="text-[10px] font-bold text-yellow-600 uppercase tracking-[0.3em]">Current Prize Pool</div>
                            <Trophy className="w-3 h-3 text-yellow-600 group-hover/prize:scale-125 transition" />
                        </div>
                        <div className="relative">
                            <h2 className="text-5xl font-black text-white tracking-tighter drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
                                <span className="text-3xl bg-clip-text text-transparent bg-gradient-to-b from-yellow-300 to-yellow-600 align-top opacity-80">৳</span>
                                {jackpot.toLocaleString()}
                            </h2>
                            {/* Reflection/Sheen effect on text via CSS mask or just overlay gradient (Simplified here) */}
                        </div>
                        <button onClick={() => setShowPrizeList(true)} className="text-[10px] text-slate-500 underline mt-2 hover:text-white transition">View All Prizes</button>
                    </div>

                    {/* CSS Pure Progress Bar */}
                    <div className="mb-6 group/progress">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-2 uppercase">
                            <span>Funding Progress</span>
                            <span className={`text-${theme.color}-400`}>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-4 bg-[#111] rounded-full overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] border border-white/5 relative">
                            {/* CSS Stripe Pattern */}
                            <div
                                className={`h-full bg-gradient-to-r from-${theme.color}-600 via-${theme.color}-500 to-${theme.color}-400 transition-all duration-1000 ease-out relative overflow-hidden`}
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute inset-0 w-full h-full"
                                    style={{
                                        backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)',
                                        backgroundSize: '1rem 1rem'
                                    }}
                                ></div>
                                {/* White Glow Tip */}
                                <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 blur-[2px]"></div>
                            </div>
                        </div>
                    </div>

                    {/* Ticket Info & Action */}
                    <div className="space-y-3 mt-auto">
                        <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5 group-hover:border-white/10 transition">
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Ticket className="w-3 h-3" /> My Entries
                            </div>
                            <span className="text-sm font-bold text-white font-mono">{Number(myTickets || 0)}</span>
                        </div>

                        <button
                            onClick={() => {
                                // [FIXED] Priority: If Open Phase, always Buy.
                                if (isOpenPhase) {
                                    buyTicket();
                                    return;
                                }

                                if (effectiveStatus === 'DRAWING') {
                                    setShowDrum(true);
                                } else if (effectiveLock) {
                                    // [FIX] Pre-Draw Alert
                                    toast('Draw starts soon! Ticket sales closed.', {
                                        icon: '⏳',
                                        style: { background: '#333', color: '#fff' }
                                    });
                                } else {
                                    buyTicket();
                                }
                            }}
                            disabled={loading} // Remove showDrum disable constraint if we want to allow recovery? No, keep standard.
                            className={`
                                relative w-full py-5 min-h-[56px] rounded-xl font-black text-lg uppercase tracking-widest overflow-hidden cursor-pointer group/btn active:scale-95 transition-transform duration-100
                                ${loading
                                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                    : (effectiveStatus === 'DRAWING' || effectiveLock)
                                        ? 'bg-gradient-to-r from-yellow-700 to-yellow-500 hover:from-yellow-600 hover:to-yellow-400 text-black shadow-[0_0_20px_rgba(234,179,8,0.5)] animate-pulse'
                                        : `bg-gradient-to-r from-${theme.color}-700 to-${theme.color}-600 hover:from-${theme.color}-600 hover:to-${theme.color}-500 text-white shadow-[0_10px_20px_-10px_rgba(var(--${theme.color}-rgb),0.5)]`
                                }
                            `}
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {loading ? 'Processing...' : (effectiveStatus === 'DRAWING' || effectiveLock) ? '👁 WATCH DRAW' : (
                                    <>
                                        <span>Join Draw</span>
                                        <span className="bg-black/20 px-2 py-0.5 rounded text-xs">{ticketPrice}৳</span>
                                    </>
                                )}
                            </span>
                            {/* Button Shine Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
                        </button>
                    </div>
                </div>
            </motion.div>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText="Buy Ticket"
            />
        </div>
    );
}
