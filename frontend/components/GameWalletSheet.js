'use client';
import { useState, useEffect } from 'react';
import { X, ArrowDown, Wallet, Gamepad2, Zap, ArrowRight, ChevronDown, Repeat } from 'lucide-react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '../context/CurrencyContext';
import toast from 'react-hot-toast';

export default function GameWalletSheet({ isOpen, onClose, onSuccess, mainBalance, gameBalance }) {
    const { formatMoney } = useCurrency(); // [NEW] Use Context
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState('deposit'); // 'deposit' (Main->Game) or 'withdraw' (Game->Main)
    const [lockedBalance, setLockedBalance] = useState(0);

    // Reset state & Fetch when opened
    useEffect(() => {
        if (isOpen) {
            setAmount('');
            setMode('deposit');
            // Fetch Locked Info
            api.get('/wallet/balance').then(res => {
                const b = res.data;
                // data structure might allow game_locked at root or deeper?
                // WalletService returns { ..., game_locked: ... } at root of response
                if (typeof b.game_locked !== 'undefined') setLockedBalance(b.game_locked);
            }).catch(console.error);
        }
    }, [isOpen]);

    const handleTransfer = async (transferAmount) => {
        const finalAmount = transferAmount || amount;
        if (!finalAmount || parseFloat(finalAmount) <= 0) return;

        setLoading(true);
        try {
            if (mode === 'deposit') {
                await api.post('/wallet/transfer/game', { amount: finalAmount });
            } else {
                await api.post('/wallet/withdraw-game', { amount: finalAmount });
            }

            // Haptic/Visual Feedback
            if (onSuccess) onSuccess();
            onClose();
            toast.success("Transfer Successful");
        } catch (err) {
            toast.error(err.response?.data?.message || 'Transfer failed');
        } finally {
            setLoading(false);
        }
    };

    const quickAmounts = [50, 100, 500, 1000];
    const sourceBalance = mode === 'deposit' ? mainBalance : gameBalance;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-[#16172B] rounded-t-[2rem] border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] max-w-[450px] mx-auto overflow-hidden"
                    >
                        {/* Drag Handle */}
                        <div className="flex justify-center pt-3 pb-1" onClick={onClose}>
                            <div className="w-12 h-1.5 bg-white/20 rounded-full"></div>
                        </div>

                        <div className="p-6 pt-2 space-y-6">

                            {/* Header */}
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-black text-white">
                                        {mode === 'deposit' ? 'Quick Top-up' : 'Withdraw Winnings'}
                                    </h3>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                                        {mode === 'deposit' ? 'Add funds to play' : 'Transfer to Main Wallet'}
                                    </p>
                                </div>
                                <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                                    <ChevronDown className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            {/* Toggle Switch */}
                            <div className="bg-slate-800/50 p-1 rounded-xl flex">
                                <button
                                    onClick={() => setMode('deposit')}
                                    className={`flex-1 py-3 rounded-lg text-xs font-black uppercase transition-all ${mode === 'deposit' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                                >
                                    Deposit
                                </button>
                                <button
                                    onClick={() => setMode('withdraw')}
                                    className={`flex-1 py-3 rounded-lg text-xs font-black uppercase transition-all ${mode === 'withdraw' ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                                >
                                    Withdraw
                                </button>
                            </div>

                            {/* Balance Cards */}
                            <div className="flex gap-4">
                                {/* Source Wallet */}
                                <div className={`flex-1 p-3 rounded-2xl border flex flex-col justify-between ${mode === 'deposit' ? 'bg-slate-800/50 border-white/5' : 'bg-purple-500/10 border-purple-500/20'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        {mode === 'deposit' ? <Wallet className="w-3.5 h-3.5 text-slate-400" /> : <Gamepad2 className="w-3.5 h-3.5 text-purple-300" />}
                                        <span className={`text-[10px] font-bold uppercase ${mode === 'deposit' ? 'text-slate-400' : 'text-purple-300'}`}>
                                            {mode === 'deposit' ? 'From Main' : 'From Game'}
                                        </span>
                                    </div>
                                    <span className={`text-lg font-black ${mode === 'deposit' ? 'text-white' : 'text-purple-100'}`}>
                                        {formatMoney(mode === 'deposit' ? mainBalance : gameBalance)}
                                    </span>
                                </div>

                                {/* Arrow */}
                                <div className="flex items-center justify-center">
                                    <div className="p-2 bg-white/5 rounded-full">
                                        <ArrowRight className="w-4 h-4 text-white/50" />
                                    </div>
                                </div>

                                {/* Destination Wallet */}
                                <div className={`flex-1 p-3 rounded-2xl border flex flex-col justify-between ${mode === 'deposit' ? 'bg-purple-500/10 border-purple-500/20' : 'bg-slate-800/50 border-white/5'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        {mode === 'deposit' ? <Gamepad2 className="w-3.5 h-3.5 text-purple-300" /> : <Wallet className="w-3.5 h-3.5 text-slate-400" />}
                                        <span className={`text-[10px] font-bold uppercase ${mode === 'deposit' ? 'text-purple-300' : 'text-slate-400'}`}>
                                            {mode === 'deposit' ? 'To Game' : 'To Main'}
                                        </span>
                                    </div>
                                    <span className={`text-lg font-black ${mode === 'deposit' ? 'text-purple-100' : 'text-white'}`}>
                                        {formatMoney(mode === 'deposit' ? gameBalance : mainBalance)}
                                    </span>
                                    {/* Locked Funds Indicator */}
                                    {mode === 'withdraw' && (
                                        <div className="mt-1 text-[10px] text-slate-400">
                                            Locked: <span className="text-red-400">{formatMoney(lockedBalance)}</span>
                                            <br />
                                            Transferable: <span className="text-emerald-400">{formatMoney(Math.max(0, gameBalance - lockedBalance))}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Turnover Warning */}
                            {mode === 'withdraw' && lockedBalance > 0 && (
                                <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                                    <Repeat className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />
                                    <p className="text-[10px] text-red-200 leading-tight">
                                        <span className="font-bold">Turnover Trap:</span> Complete more spins to unlock your winnings.
                                        <br />Only transferable balance can be withdrawn.
                                    </p>
                                </div>
                            )}

                            {/* Quick Amounts */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5">
                                    <Zap className="w-3.5 h-3.5" /> Quick Select
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {quickAmounts.map((amt) => (
                                        <button
                                            key={amt}
                                            disabled={loading || parseFloat(sourceBalance) < amt}
                                            onClick={() => handleTransfer(amt)}
                                            className={`py-2.5 rounded-xl text-sm font-black transition-all ${parseFloat(sourceBalance) < amt ? 'opacity-30 cursor-not-allowed bg-white/5' : 'bg-white/5 hover:bg-white/10 active:bg-white/20 active:text-white border border-white/5'}`}
                                        >
                                            {amt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Amount Input & Submit */}
                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="Enter custom amount..."
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full pl-4 pr-32 py-4 bg-[#0B0C15] border border-white/10 rounded-xl font-bold text-white placeholder-slate-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all outline-none"
                                />
                                <button
                                    onClick={() => handleTransfer()}
                                    disabled={loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(sourceBalance)}
                                    className={`absolute right-1.5 top-1.5 bottom-1.5 px-6 rounded-lg font-bold text-sm text-white shadow-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${mode === 'deposit' ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/20' : 'bg-pink-600 hover:bg-pink-500 shadow-pink-900/20'}`}
                                >
                                    {loading ? 'Processing...' : (mode === 'deposit' ? 'Add Funds' : 'Withdraw')}
                                </button>
                            </div>

                            {/* Footer Safe Area Spacer */}
                            <div className="h-4"></div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
