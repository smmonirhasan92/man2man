'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Trophy, History } from 'lucide-react';
import Link from 'next/link';
import api from '../../../services/api';
import { walletService } from '../../../services/walletService';
import GameWalletSheet from '@/components/GameWalletSheet';
import AviatorCanvas from '@/components/game/AviatorCanvas';
import LiveTicker from '@/components/game/LiveTicker';
import { useNotification } from '@/context/NotificationContext';

export default function AviatorPage() {
    const { showError, showSuccess } = useNotification();

    // Game State
    const [multiplier, setMultiplier] = useState(1.00);
    const [gameState, setGameState] = useState('WAITING');
    const [history, setHistory] = useState([]);

    // Wallet & User
    const [balance, setBalance] = useState(0);
    const [mainBalance, setMainBalance] = useState(0); // Not always needed but good for modal
    const [isWalletSheetOpen, setIsWalletSheetOpen] = useState(false);

    // Betting
    const [betAmount, setBetAmount] = useState(50);
    const [activeBet, setActiveBet] = useState(null); // { amount, cashedOut: false } works as boolean check too
    const [lastWin, setLastWin] = useState(null);

    // Sync Refs
    const startTimeRef = useRef(0);
    const timeOffsetRef = useRef(0);
    const stateRef = useRef('WAITING'); // Ref for loop access without closure staleness
    const crashPointRef = useRef(0);

    // --- Initialization ---
    useEffect(() => {
        fetchBalance();

        // Polling for State (Every 1s is fine since we calculate physics locally)
        const interval = setInterval(syncState, 1000);

        // Animation Loop (60FPS)
        let animId;
        const animate = () => {
            updatePhysics();
            animId = requestAnimationFrame(animate);
        };
        animId = requestAnimationFrame(animate);

        return () => {
            clearInterval(interval);
            cancelAnimationFrame(animId);
        };
    }, []);

    const fetchBalance = async () => {
        try {
            const data = await walletService.getBalance();
            setBalance(data.game_balance || 0);
            setMainBalance(data.wallet_balance || 0);
        } catch (e) {
            // console.error("Balance fetch error", e);
        }
    };

    const syncState = async () => {
        try {
            const res = await api.get('/game/aviator/state');
            const data = res.data;

            // 1. Time Sync (Crucial)
            // Offset = ServerTime - ClientTime
            // We use this to adjust our Date.now() to match Server's Date.now()
            const now = Date.now();
            timeOffsetRef.current = data.serverTime - now;

            // 2. Update Refs
            startTimeRef.current = data.startTime;
            stateRef.current = data.state;
            crashPointRef.current = data.crashPoint;

            // 3. State Transitions
            setGameState(data.state);
            setHistory(data.history || []);

            // Handle Crash / Reset
            if (data.state === 'CRASHED') {
                setMultiplier(data.crashPoint);
                if (activeBet && !activeBet.cashedOut) {
                    setActiveBet(null);
                }
            } else if (data.state === 'WAITING') {
                setMultiplier(1.00);
                setLastWin(null);
            }

        } catch (e) {
            // Silent error (polling)
        }
    };

    // --- Physics Engine (Matches Backend) ---
    const updatePhysics = () => {
        if (stateRef.current === 'FLYING') {
            const now = Date.now() + timeOffsetRef.current; // Adjusted Server Time
            const elapsedSec = (now - startTimeRef.current) / 1000;

            // M(t) = e^(0.065 * t)
            let m = Math.pow(Math.E, 0.065 * elapsedSec);
            if (m < 1) m = 1;

            setMultiplier(m);
        }
    };

    // --- Actions ---
    const handleBet = async () => {
        if (activeBet) return;
        if (balance < betAmount) {
            showError('Insufficient Game Balance!');
            setIsWalletSheetOpen(true);
            return;
        }

        try {
            // Optimistic Update
            setBalance(prev => prev - betAmount);
            setActiveBet({ amount: betAmount, cashedOut: false });

            const res = await api.post('/game/aviator/bet', { betAmount });

            // [FIX] Strict ID Validation
            if (res.data && res.data.betId) {
                console.log("[AVIATOR] Bet Placed. ID:", res.data.betId);
                setActiveBet({ amount: betAmount, cashedOut: false, betId: res.data.betId });
                showSuccess('Bet Placed Successfully');
            } else {
                console.error("[AVIATOR] Bet Response Missing ID:", res.data);
                throw new Error("Invalid Bet Response: ID Missing");
            }
        } catch (e) {
            console.error("[AVIATOR] Bet Error:", e);
            setBalance(prev => prev + betAmount); // Revert
            setActiveBet(null);
            showError(e.response?.data?.message || 'Bet Failed');
        }
    };

    const handleCashout = async () => {
        if (!activeBet || activeBet.cashedOut) return;

        try {
            // Optimistic UI freeze
            const currentM = multiplier;

            const res = await api.post('/game/aviator/cashout', {
                betId: activeBet.betId,
                multiplier: currentM
            });

            const winAmount = res.data.winAmount;
            const newBal = res.data.newBalance;

            setActiveBet({ ...activeBet, cashedOut: true });
            setLastWin({ amount: winAmount, multiplier: currentM });
            setBalance(newBal); // Trust server balance

            showSuccess(`Cashed Out: ৳${winAmount.toFixed(2)}`);
        } catch (e) {
            showError(e.response?.data?.message || 'Cashout Failed');
        }
    };

    return (
        <div className="flex flex-col h-screen w-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/60 via-[#0a0f1d] to-[#000000] text-white font-sans select-none touch-none overflow-hidden fixed inset-0">
            {/* Wallet Modal */}
            <GameWalletSheet
                isOpen={isWalletSheetOpen}
                onClose={() => setIsWalletSheetOpen(false)}
                onSuccess={fetchBalance}
                mainBalance={mainBalance}
                gameBalance={balance}
            />

            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-20 px-4 py-3 pt-safe-top flex justify-between items-center bg-gradient-to-b from-slate-900/90 to-transparent">
                <Link href="/game-center">
                    <button className="bg-white/10 p-2 rounded-full backdrop-blur-md active:scale-95 transition hover:bg-white/20">
                        <ArrowLeft size={20} className="text-white" />
                    </button>
                </Link>

                {/* Balance Pill */}
                <button
                    onClick={() => setIsWalletSheetOpen(true)}
                    className="flex items-center gap-2 bg-slate-800/80 backdrop-blur-md pl-4 pr-1 py-1 rounded-full border border-slate-700 shadow-lg active:scale-95 transition hover:border-green-500/50"
                >
                    <span className="font-mono font-bold text-green-400 text-lg">৳{Number(balance).toFixed(2)}</span>
                    <div className="w-8 h-8 rounded-full bg-green-500 text-slate-900 flex items-center justify-center text-xl font-bold">+</div>
                </button>
            </div>

            {/* History Ticker */}
            <div className="absolute top-20 left-0 w-full z-10 px-4 flex gap-2 overflow-x-auto no-scrollbar mask-fade-right">
                {history.map((res, i) => (
                    <div key={i} className={`px-2 py-1 rounded text-xs font-bold font-mono whitespace-nowrap border ${res >= 2.00 ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'bg-blue-500/20 border-blue-500/50 text-blue-300'}`}>
                        {Number(res).toFixed(2)}x
                    </div>
                ))}
            </div>

            {/* Game Canvas (Full Screen Behind Controls) */}
            <div className="absolute inset-0 z-0 bg-slate-950/50 pb-[160px]"> {/* Padding bottom to clear controls */}
                <AviatorCanvas
                    gameState={gameState}
                    multiplier={multiplier}
                />

                {/* Central Multiplier */}
                {gameState === 'FLYING' && (
                    <div className="absolute top-[30%] left-0 right-0 text-center pointer-events-none">
                        <div className="text-7xl md:text-8xl font-black text-white drop-shadow-[0_0_30px_rgba(239,68,68,0.5)] tabular-nums tracking-tighter">
                            {multiplier.toFixed(2)}x
                        </div>
                        <div className="text-slate-400 font-bold tracking-widest text-sm mt-2 animate-pulse">CURRENT PAYOUT</div>
                        {/* Live Ticker Overlay */}
                        <div className="mt-8 max-w-xs mx-auto opacity-80">
                            <LiveTicker />
                        </div>
                    </div>
                )}

                {/* Win Overlay */}
                {lastWin && (
                    <div className="absolute top-[35%] left-0 right-0 z-30 flex justify-center pointer-events-none animate-in fade-in zoom-in duration-300">
                        <div className="bg-green-600/90 backdrop-blur-xl px-8 py-6 rounded-3xl border-2 border-green-400 text-center shadow-[0_0_50px_rgba(34,197,94,0.5)] transform scale-110">
                            <div className="text-yellow-300 font-black text-xs uppercase tracking-[0.2em] mb-1">You Won</div>
                            <div className="text-4xl font-mono font-black text-white">৳{Number(lastWin.amount).toFixed(2)}</div>
                            <div className="text-white/80 text-sm font-bold mt-1">Multiplier: {Number(lastWin.multiplier).toFixed(2)}x</div>
                        </div>
                    </div>
                )}

                {/* Waiting Overlay */}
                {gameState === 'WAITING' && (
                    <div className="absolute top-[40%] left-0 right-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                        <div className="bg-slate-800/80 backdrop-blur px-6 py-3 rounded-2xl border border-slate-600 flex items-center gap-3">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                            </span>
                            <span className="font-bold text-sky-400 tracking-wider">NEXT ROUND STARTING...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls (Fixed Bottom) */}
            <div className="fixed bottom-0 left-0 right-0 w-full bg-slate-900 border-t border-slate-800 p-4 pb-6 z-40 shadow-[0_-20px_60px_rgba(0,0,0,0.9)]">
                <div className="max-w-md mx-auto flex flex-col gap-4">

                    {/* Bet Selector */}
                    <div className="flex items-center gap-1 bg-slate-900/50 p-1.5 rounded-xl border border-slate-800">
                        <button onClick={() => setBetAmount(Math.max(10, betAmount - 10))} className="w-12 h-12 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition font-bold text-xl active:bg-slate-900">-</button>
                        <div className="flex-1 text-center">
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Bet Amount</div>
                            <input
                                type="number"
                                className="w-full bg-transparent text-center font-black text-2xl text-white outline-none"
                                value={betAmount}
                                onChange={(e) => setBetAmount(Number(e.target.value))}
                            />
                        </div>
                        <button onClick={() => setBetAmount(betAmount + 10)} className="w-12 h-12 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition font-bold text-xl active:bg-slate-900">+</button>
                    </div>

                    {/* Main Button */}
                    {gameState === 'WAITING' || !activeBet ? (
                        <button
                            onClick={handleBet}
                            disabled={gameState !== 'WAITING' || activeBet}
                            className={`w-full h-16 rounded-xl font-black text-2xl uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3
                                ${gameState === 'WAITING' && !activeBet
                                    ? 'bg-green-500 hover:bg-green-400 text-slate-900 shadow-green-500/20'
                                    : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'}`}
                        >
                            {activeBet ? (
                                <><span>Bet Placed</span><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> </>
                            ) : 'Place Bet'}
                        </button>
                    ) : (
                        <button
                            onClick={handleCashout}
                            disabled={gameState !== 'FLYING' || activeBet?.cashedOut}
                            className="w-full h-16 rounded-xl font-black text-2xl uppercase tracking-widest shadow-lg transition-all active:scale-95 bg-orange-500 hover:bg-orange-400 text-white shadow-orange-500/20 flex flex-col items-center justify-center leading-none border-b-4 border-orange-700 active:border-b-0 translate-y-0 active:translate-y-1"
                        >
                            <span className="text-sm font-bold opacity-80 mb-1">CASH OUT</span>
                            <span>৳{(betAmount * multiplier).toFixed(2)}</span>
                        </button>
                    )}
                </div>
            </div>

            <style jsx global>{`
                .pt-safe-top { padding-top: max(1rem, env(safe-area-inset-top)); }
                .mask-fade-right { mask-image: linear-gradient(to right, black 85%, transparent); }
            `}</style>
        </div>
    );
}
