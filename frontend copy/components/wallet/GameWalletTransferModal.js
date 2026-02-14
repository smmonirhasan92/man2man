'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRightLeft, Wallet, Gamepad2, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

export default function GameWalletTransferModal({ isOpen, onClose }) {
    const { user, refreshUser } = useAuth();
    const [amount, setAmount] = useState('');
    const [mode, setMode] = useState('DEPOSIT'); // DEPOSIT (Main -> Game), WITHDRAW (Game -> Main), INCOME (Income -> Main)
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);

    const handleTransfer = async () => {
        if (!amount || isNaN(amount) || amount <= 0) {
            setMsg({ type: 'error', text: 'Enter a valid amount' });
            return;
        }

        setLoading(true);
        setMsg(null);
        try {
            let endpoint = '';
            let payload = { amount: parseFloat(amount) };

            if (mode === 'DEPOSIT') endpoint = '/wallet/transfer/game';
            else if (mode === 'WITHDRAW') endpoint = '/wallet/withdraw-game';
            else if (mode === 'INCOME') endpoint = '/wallet/transfer/main';

            const { data } = await api.post(endpoint, payload);

            setMsg({ type: 'success', text: data.message || 'Transfer successful!' });
            setAmount('');
            refreshUser(); // Sync balance immediately

            // Auto close after success? Maybe keep open for multiple transfers.
        } catch (err) {
            setMsg({ type: 'error', text: err.response?.data?.message || 'Transfer failed' });
        } finally {
            setLoading(false);
        }
    };

    const setMax = () => {
        if (mode === 'DEPOSIT') setAmount(user?.wallet_balance || 0);
        else if (mode === 'WITHDRAW') setAmount(user?.game_balance || 0);
        else if (mode === 'INCOME') setAmount(user?.wallet?.income || 0);
    };

    if (!isOpen) return null;

    // Use Portal to escape overflow-hidden containers
    const { createPortal } = require('react-dom');
    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <div className="bg-slate-800 p-4 flex justify-between items-center border-b border-white/5">
                        <h3 className="font-bold text-lg flex items-center gap-2 text-white">
                            <ArrowRightLeft className="text-cyan-400 w-5 h-5" /> Transfer Funds
                        </h3>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 transition">
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-6">

                        {/* Toggle Mode (3 Tabs) */}
                        <div className="flex bg-slate-950 p-1 rounded-xl gap-1">
                            <button
                                onClick={() => setMode('DEPOSIT')}
                                className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1
                                ${mode === 'DEPOSIT' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                            >
                                <Wallet className="w-3 h-3" /> Main → Game
                            </button>
                            <button
                                onClick={() => setMode('WITHDRAW')}
                                className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1
                                ${mode === 'WITHDRAW' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                            >
                                <Gamepad2 className="w-3 h-3" /> Game → Main
                            </button>
                            <button
                                onClick={() => setMode('INCOME')}
                                className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all flex flex-col sm:flex-row items-center justify-center gap-1
                                ${mode === 'INCOME' ? 'bg-amber-600 text-black shadow-lg' : 'text-slate-500 hover:text-white'}`}
                            >
                                <ArrowRightLeft className="w-3 h-3" /> Income → Main
                            </button>
                        </div>

                        {/* Balance Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className={`p-3 rounded-xl border transition-colors bg-slate-800 border-white/5`}>
                                <p className="text-xs text-slate-400 mb-1">
                                    {mode === 'DEPOSIT' ? 'From: Main Wallet' : (mode === 'WITHDRAW' ? 'From: Game Wallet' : 'From: Income Wallet')}
                                </p>
                                <p className="text-lg font-bold text-white">
                                    ৳{mode === 'INCOME' ? (user?.wallet?.income || 0).toLocaleString() : (mode === 'DEPOSIT' ? (user?.wallet_balance || 0).toLocaleString() : (user?.game_balance || 0).toLocaleString())}
                                </p>
                            </div>
                            <div className={`p-3 rounded-xl border transition-colors bg-slate-950 border-white/5`}>
                                <p className="text-xs text-slate-400 mb-1">
                                    {mode === 'DEPOSIT' ? 'To: Game Wallet' : (mode === 'WITHDRAW' ? 'To: Main Wallet' : 'To: Main Wallet')}
                                </p>
                                <p className="text-lg font-bold text-slate-500">
                                    {mode === 'DEPOSIT' ? (user?.game_balance || 0).toLocaleString() : (user?.wallet_balance || 0).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        {/* Input */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase">Amount to Transfer</label>
                            <div className="relative">
                                <span className="absolute left-4 top-3.5 text-slate-500 font-bold">৳</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-8 pr-16 text-white font-bold focus:outline-none focus:border-cyan-500 transition-colors"
                                    placeholder="0.00"
                                />
                                <button
                                    onClick={setMax}
                                    className="absolute right-2 top-2 px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-cyan-400 font-bold rounded transition"
                                >
                                    MAX
                                </button>
                            </div>
                        </div>

                        {/* Fee Warning */}
                        {mode === 'INCOME' && (
                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                                <p className="text-xs text-amber-200">
                                    <span className="font-bold">Note:</span> A 3% Exchange Fee applies to transfers from Income Wallet to Main Wallet.
                                </p>
                            </div>
                        )}

                        {/* Feedback Message */}
                        {msg && (
                            <div className={`p-3 rounded-lg flex items-center gap-2 text-sm font-bold ${msg.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                {msg.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                {msg.text}
                            </div>
                        )}

                        {/* Action Button */}
                        <button
                            onClick={handleTransfer}
                            disabled={loading}
                            className={`w-full py-3.5 rounded-xl font-bold uppercase tracking-wider text-white shadow-lg transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                                ${mode === 'DEPOSIT' ? 'bg-emerald-600 hover:bg-emerald-500' : (mode === 'WITHDRAW' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-amber-600 hover:bg-amber-500 text-black')}
                            `}
                        >
                            {loading ? 'Processing...' : (mode === 'DEPOSIT' ? 'Deposit to Game' : (mode === 'WITHDRAW' ? 'Withdraw to Main' : 'Transfer to Main'))}
                        </button>

                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}
