import React, { useState, useEffect } from 'react';

export default function StakeModal({ isOpen, onClose, pool, userBalance, onConfirm }) {
    const [amount, setAmount] = useState('');
    const [expectedProfit, setExpectedProfit] = useState(0);

    useEffect(() => {
        if (!isOpen) setAmount('');
    }, [isOpen]);

    useEffect(() => {
        const numAmount = Number(amount);
        if (numAmount > 0 && pool) {
            setExpectedProfit((numAmount * (pool.rewardPercentage / 100)).toFixed(2));
        } else {
            setExpectedProfit(0);
        }
    }, [amount, pool]);

    if (!isOpen || !pool) return null;

    const maxAmount = userBalance || 0;
    const isValid = amount && Number(amount) >= Math.max(5, pool.minAmount) && Number(amount) <= maxAmount;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isValid) {
            onConfirm(pool._id, Number(amount));
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#020617]/80 backdrop-blur-md p-4 animate-fade-in font-sans">
            <div className="bg-[#0f172a] border border-slate-700/50 w-full max-w-sm rounded-[24px] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden relative">
                {/* Decorative Glowing Top Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500"></div>

                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-xl font-black text-white">{pool.name}</h2>
                            <p className="text-sm text-slate-400 mt-1 flex items-center gap-1">
                                ⏱️ Lock for {pool.durationDays} Days
                            </p>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition font-bold text-xl">
                            ✕
                        </button>
                    </div>

                    {/* Stats Card */}
                    <div className="bg-[#1e293b] rounded-xl p-4 mb-6 border border-slate-700/50">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-sm text-slate-400">Fixed ROI</span>
                            <span className="font-black text-emerald-400 text-lg">+{pool.rewardPercentage}%</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Income Wallet</span>
                            <span className="font-bold text-white">{maxAmount.toFixed(2)} NXS</span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-2">
                            <span className="text-slate-400">Minimum Lock</span>
                            <span className="font-bold text-white">{Math.max(5, pool.minAmount)} NXS</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-6 relative">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                Amount to Lock (NXS)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder={`Min ${pool.minAmount}`}
                                    className="w-full bg-[#0b1120] border border-slate-600 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-emerald-500 transition-all text-lg"
                                />
                                <button
                                    type="button"
                                    onClick={() => setAmount(maxAmount)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg hover:bg-emerald-500 hover:text-white transition"
                                >
                                    MAX
                                </button>
                            </div>
                        </div>

                        {/* Live Calculation */}
                        {Number(amount) > 0 && (
                            <div className="mb-6 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400">Principal Locked:</span>
                                    <span className="font-bold text-white">{amount} NXS</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                                        📈 Total Profit:
                                    </span>
                                    <span className="font-bold text-emerald-400">+{expectedProfit} NXS</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] mt-1">
                                    <span className="text-emerald-500/70 font-bold flex items-center gap-1 uppercase tracking-widest">
                                        ⏱️ Daily Payout:
                                    </span>
                                    <span className="font-bold text-emerald-500/90">+{(expectedProfit / pool.durationDays).toFixed(2)} NXS/Day</span>
                                </div>
                                <div className="h-px bg-slate-700/50 my-2"></div>
                                <div className="flex justify-between items-center font-black">
                                    <span className="text-slate-300">Total Return:</span>
                                    <span className="text-white text-lg">{(Number(amount) + Number(expectedProfit)).toFixed(2)} NXS</span>
                                </div>
                            </div>
                        )}

                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-xl mb-6 flex gap-2 items-start">
                            <span className="text-yellow-500 flex-shrink-0 mt-0.5 font-bold">⚠️</span>
                            <p className="text-[11px] text-yellow-500/90 font-bold leading-relaxed">
                                Early withdrawal incurs a <span className="text-white">5% penalty</span> on principal and <span className="text-white">CLAWS BACK</span> any daily profits already paid to you. Funds will be locked for exactly {pool.durationDays} days.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 rounded-xl font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!isValid}
                                className="flex-1 py-3 flex items-center justify-center gap-2 rounded-xl font-black bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg hover:shadow-emerald-500/25 transition disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                            >
                                🔒 LOCK NOW
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
