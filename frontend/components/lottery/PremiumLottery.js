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
    const [drawType, setDrawType] = useState(initialData?.drawType || 'SALES_BASED'); // [HYBRID]
    const [ticketQuantity, setTicketQuantity] = useState(1); // Multi-Ticket Selector
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
                setProgress(data.progress || 0);
                setSlotId(data.slotId);
                setPrizes(data.prizes || []);
                if (data.drawType) setDrawType(data.drawType);
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
                if (data.drawType) setDrawType(data.drawType);
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
                toast('Draw Cycle Complete. Winners Finalized.', {
                    icon: '🏆',
                    style: { background: '#1e293b', color: '#fff', border: '1px solid #3b82f6' }
                });
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
                message: `Are you sure you want to buy ${ticketQuantity} entry(s) for ${tier}? It will cost ${ticketPrice * ticketQuantity} NXS.`,
                onConfirm: () => buyTicket(true)
            });
            return;
        }

        setLoading(true);
        try {
            await api.post('/lottery/buy', { lotteryId: slotId, quantity: ticketQuantity });
            toast.success(`${ticketQuantity} Ticket(s) Purchased!`, {
                style: { background: '#0a192f', color: '#fff', border: '1px solid #3b82f6' },
                iconTheme: { primary: '#3b82f6', secondary: '#fff' }
            });
            setMyTickets(prev => prev + ticketQuantity);
            setTicketQuantity(1); // Reset after purchase
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
            setTimeLeft(drawType === 'SALES_BASED' ? 'AWAITING STOCK TARGET' : 'LIVE');
            return;
        }

        // If SALES_BASED and lockDrawUntilTargetMet is true, time is strictly relative to sales. 
        // But if endTime exists, we still show the timer.

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

                        {/* PROFESSIONAL PROCESSING ANIMATION */}
                        <div className="flex flex-col items-center justify-center mb-8 relative z-10 px-8 py-12 bg-black/50 rounded-3xl border border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.2)]">
                            <div className="w-16 h-16 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mb-6"></div>
                            <div className="text-xl font-bold text-slate-300 font-mono tracking-widest uppercase text-center mb-2">
                                Executing Draw Algorithm
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono uppercase">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                Validating blockchain hashes...
                            </div>
                        </div>

                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className={`text-white font-black text-2xl tracking-[0.2em] animate-pulse drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] relative z-10`}
                        >
                            FINALIZING RESULTS...
                        </motion.div>
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


            {/* UI CONDITIONAL RENDERING */}
            {drawType === 'TIME_BASED' ? (
                /* -------------------------------------------------------------------------- */
                /*                         DESIGN A: TIME-BASED (NEON TECH)                   */
                /* -------------------------------------------------------------------------- */
                <motion.div layoutId={`lottery-card-${tier}`} className="relative bg-[#050505] rounded-3xl p-[1px] shadow-[0_0_40px_-5px_rgba(6,182,212,0.2)] overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/30 via-transparent to-blue-900/30 opacity-50 group-hover:opacity-100 transition duration-1000"></div>
                    <div className="relative w-full h-auto bg-[#080d16] rounded-[23px] overflow-hidden flex flex-col justify-between p-5 md:p-7">

                        {/* Header Content */}
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-black border border-cyan-500/30 shadow-[inset_0_0_15px_rgba(6,182,212,0.2)]">
                                    <Timer className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                                </div>
                                <div>
                                    <h3 className="font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-200 text-xl tracking-wider uppercase drop-shadow-md">
                                        {theme.label}
                                    </h3>
                                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                        WINNING: <span className="text-cyan-400 font-bold">{prizes.length > 0 ? Math.min(...prizes.map(p => p.amount)).toLocaleString() : jackpot.toLocaleString()}</span> - <span className="text-cyan-400 font-bold">{prizes.length > 0 ? Math.max(...prizes.map(p => p.amount)).toLocaleString() : jackpot.toLocaleString()} NXS</span>
                                    </div>
                                    <div className="text-[10px] font-bold text-cyan-500 uppercase flex items-center gap-2 mt-1 drop-shadow-sm">
                                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                                        {effectiveStatus === 'DRAWING' ? 'DRAWING NOW' : (timeLeft === 'LIVE' ? 'LIVE NOW' : (isOpenPhase ? 'STATUS: OPEN' : 'STATUS: WAITING'))}
                                        {isPhaseLocked && <span className="text-red-500 ml-1">(Locked)</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Neon Digital Clock */}
                        <div className="mb-6 flex flex-col items-center justify-center bg-[#03060a] rounded-2xl p-6 border border-cyan-900/50 shadow-[0_0_20px_rgba(6,182,212,0.05)] relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent pointer-events-none"></div>
                            <span className="text-[10px] font-bold text-cyan-700 mb-2 uppercase tracking-[0.2em] flex items-center gap-2 z-10">
                                <Zap className="w-3 h-3 text-cyan-500" /> Time Remaining
                            </span>
                            <span className={`text-5xl md:text-6xl font-black font-mono tracking-widest text-center z-10 ${timeLeft.includes('0h 0m') ? 'text-red-500 animate-pulse drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]'}`}>
                                {timeLeft}
                            </span>
                        </div>

                        {/* Jackpot Display */}
                        <div className="text-center mb-8 relative">
                            <div className="text-[10px] font-black text-cyan-700/80 uppercase tracking-[0.3em] mb-1 cursor-pointer flex justify-center items-center gap-1" onClick={() => setShowPrizeList(true)}>
                                Guaranteed Prize Pool <Trophy className="w-3 h-3 text-cyan-600" />
                            </div>
                            <h2 className="text-5xl font-black text-white tracking-tighter drop-shadow-[0_8px_8px_rgba(0,0,0,0.5)]">
                                {jackpot.toLocaleString()}<span className="text-2xl font-bold text-cyan-500 ml-2">NXS</span>
                            </h2>
                            <button onClick={() => setShowPrizeList(true)} className="text-[10px] text-cyan-700 underline mt-2 hover:text-cyan-400 transition">View Tiers ({prizes.length || 1} Winners)</button>
                        </div>

                        {/* Action Area */}
                        <div className="space-y-4 mt-auto">
                            <div className="flex justify-between items-center bg-cyan-950/20 p-3 rounded-xl border border-cyan-900/30">
                                <span className="text-xs text-cyan-600/80 uppercase font-bold tracking-widest flex items-center gap-2"><Ticket className="w-3 h-3" /> My Entries</span>
                                <span className="font-bold text-white font-mono text-lg">{Number(myTickets || 0)}</span>
                            </div>

                            {(!isPhaseLocked && effectiveStatus !== 'DRAWING') && (
                                <div className="flex justify-between items-center bg-[#03060a] p-2 rounded-xl border border-cyan-900/50">
                                    <span className="text-[10px] text-cyan-700 uppercase font-bold ml-2">Quantity</span>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setTicketQuantity(Math.max(1, ticketQuantity - 1))} className="w-10 h-10 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-400 font-bold transition flex items-center justify-center text-xl">-</button>
                                        <span className="w-10 text-center font-bold text-white font-mono text-xl">{ticketQuantity}</span>
                                        <button onClick={() => setTicketQuantity(Math.min(50, ticketQuantity + 1))} className="w-10 h-10 rounded-lg bg-cyan-900/80 hover:bg-cyan-800 text-cyan-300 font-bold transition flex items-center justify-center text-xl">+</button>
                                    </div>
                                </div>
                            )}

                            {/* Buy Button */}
                            <button
                                onClick={() => {
                                    if (isOpenPhase) { buyTicket(); return; }
                                    if (effectiveStatus === 'DRAWING') setShowDrum(true);
                                    else if (effectiveLock) toast('Draw starts soon! Ticket sales closed.', { icon: '⏳', style: { background: '#333', color: '#fff' } });
                                    else buyTicket();
                                }}
                                disabled={loading}
                                className={`relative w-full py-5 rounded-xl font-black text-lg uppercase tracking-[0.2em] transition-all overflow-hidden group/btn ${loading ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : (effectiveStatus === 'DRAWING' || effectiveLock) ? 'bg-cyan-700 text-white animate-pulse shadow-[0_0_20px_rgba(6,182,212,0.5)] border border-cyan-400/50' : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-[0_0_30px_rgba(6,182,212,0.4)] border border-cyan-400/30'}`}
                            >
                                <span className="relative z-10 drop-shadow-md">
                                    {loading ? 'Processing...' : (effectiveStatus === 'DRAWING' || effectiveLock) ? 'Watch Draw' : `Secure Entry (${ticketPrice * ticketQuantity} NXS)`}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
                            </button>
                        </div>
                    </div>
                </motion.div>
            ) : (
                /* -------------------------------------------------------------------------- */
                /*                         DESIGN B: SALES-BASED (CROWD FUNDING)              */
                /* -------------------------------------------------------------------------- */
                <motion.div layoutId={`lottery-card-${tier}`} className="relative bg-[#050505] rounded-3xl p-[1px] shadow-[0_0_40px_-5px_rgba(16,185,129,0.2)] overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 via-transparent to-emerald-900/30 opacity-50 group-hover:opacity-100 transition duration-1000"></div>
                    <div className="relative w-full h-auto bg-[#040d08] rounded-[23px] overflow-hidden flex flex-col justify-between p-5 md:p-7">

                        {/* Header Content */}
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-black border border-emerald-500/30 shadow-[inset_0_0_15px_rgba(16,185,129,0.2)]">
                                    <Target className="w-6 h-6 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                </div>
                                <div>
                                    <h3 className="font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-200 text-xl tracking-wider uppercase drop-shadow-md">
                                        Volume Target
                                    </h3>
                                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                                        TIER: <span className="text-emerald-400 font-bold uppercase">{theme.label}</span>
                                    </div>
                                    <div className="text-[10px] font-bold text-emerald-500 uppercase flex items-center gap-2 mt-1 drop-shadow-sm">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></span>
                                        {effectiveStatus === 'DRAWING' ? 'EXECUTING NOW' : 'COLLECTING ENTRIES'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Jackpot Display */}
                        <div className="text-center mb-8 relative py-4 bg-emerald-950/10 rounded-2xl border border-emerald-900/20">
                            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-20 bg-emerald-500/5 blur-3xl rounded-full"></div>
                            <div className="text-[10px] font-black text-emerald-700/80 uppercase tracking-[0.3em] mb-2 cursor-pointer flex justify-center items-center gap-1" onClick={() => setShowPrizeList(true)}>
                                Target Prize Pool <Trophy className="w-3 h-3 text-emerald-600" />
                            </div>
                            <h2 className="text-5xl font-black text-white tracking-tighter drop-shadow-[0_8px_8px_rgba(0,0,0,0.5)]">
                                {jackpot.toLocaleString()}<span className="text-2xl font-bold text-emerald-500 ml-2">NXS</span>
                            </h2>
                            <button onClick={() => setShowPrizeList(true)} className="text-[10px] text-emerald-700 underline mt-2 hover:text-emerald-400 transition">View Tiers ({prizes.length || 1} Winners)</button>
                        </div>

                        {/* Crowd Funding Bar */}
                        <div className="mb-10 bg-[#020604] p-4 rounded-xl border border-emerald-900/30">
                            <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-widest">
                                <span>Volume Goal</span>
                                <span className="text-emerald-400 font-mono">{Math.round(progress)}% Filled</span>
                            </div>
                            <div className="h-6 bg-[#010302] rounded-full overflow-hidden border border-emerald-900/50 relative shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]">
                                <div className="h-full bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-400 relative transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}>
                                    <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1.5rem 1.5rem' }}></div>
                                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/60 blur-[3px]"></div>
                                </div>
                            </div>
                        </div>

                        {/* Action Area */}
                        <div className="space-y-4 mt-auto">
                            <div className="flex justify-between items-center bg-emerald-950/20 p-3 rounded-xl border border-emerald-900/30">
                                <span className="text-xs text-emerald-600/80 uppercase font-bold tracking-widest flex items-center gap-2"><Ticket className="w-3 h-3" /> My Entries</span>
                                <span className="font-bold text-white font-mono text-lg">{Number(myTickets || 0)}</span>
                            </div>

                            {(!isPhaseLocked && effectiveStatus !== 'DRAWING') && (
                                <div className="flex justify-between items-center bg-[#020604] p-2 rounded-xl border border-emerald-900/50">
                                    <span className="text-[10px] text-emerald-700 uppercase font-bold ml-2">Quantity</span>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setTicketQuantity(Math.max(1, ticketQuantity - 1))} className="w-10 h-10 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-500 font-bold transition flex items-center justify-center text-xl">-</button>
                                        <span className="w-10 text-center font-bold text-white font-mono text-xl">{ticketQuantity}</span>
                                        <button onClick={() => setTicketQuantity(Math.min(50, ticketQuantity + 1))} className="w-10 h-10 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-emerald-400 font-bold transition flex items-center justify-center text-xl">+</button>
                                    </div>
                                </div>
                            )}

                            {/* Buy Button */}
                            <button
                                onClick={() => {
                                    if (isOpenPhase) { buyTicket(); return; }
                                    if (effectiveStatus === 'DRAWING') setShowDrum(true);
                                    else if (effectiveLock) toast('Market closed! Target reached.', { icon: '🎯', style: { background: '#111', color: '#10b981' } });
                                    else buyTicket();
                                }}
                                disabled={loading}
                                className={`relative w-full py-5 rounded-xl font-black text-lg uppercase tracking-[0.2em] transition-all overflow-hidden group/btn ${loading ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : (effectiveStatus === 'DRAWING' || effectiveLock) ? 'bg-emerald-700 text-white animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.5)] border border-emerald-400/50' : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-[0_0_30px_rgba(16,185,129,0.3)] border border-emerald-400/30'}`}
                            >
                                <span className="relative z-10 drop-shadow-md">
                                    {loading ? 'Processing...' : (effectiveStatus === 'DRAWING' || effectiveLock) ? 'Watch Draw' : `Contribute (${ticketPrice * ticketQuantity} NXS)`}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

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
