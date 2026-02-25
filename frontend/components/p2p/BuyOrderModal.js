import React, { useState } from 'react';
import { X, DollarSign, Wallet } from 'lucide-react';

export default function BuyOrderModal({ isOpen, onClose, order, onConfirm }) {
    const [amount, setAmount] = useState('');

    if (!isOpen || !order) return null;

    const liveAvailable = order.userId?.wallet?.main || 0;
    const rate = order.rate || 126; // Fallback if no rate
    const maxLimit = Math.min(order.amount, liveAvailable);

    const handleSubmit = (e) => {
        e.preventDefault();
        const numAmount = Number(amount);
        if (numAmount > 0 && numAmount <= maxLimit) {
            onConfirm(numAmount);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020617]/80 backdrop-blur-md p-4 animate-fade-in font-sans">
            <div className="bg-[#0f172a] border border-slate-700/50 w-full max-w-sm rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden animate-slide-up relative">

                {/* Decorative glowing gradient top bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500"></div>

                {/* Header */}
                <div className="bg-slate-800/30 p-5 relative border-b border-slate-700/50">
                    <button onClick={onClose} className="absolute top-5 right-4 text-slate-400 hover:text-white hover:rotate-90 transition-all duration-300">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                            <DollarSign className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white tracking-wide">BUY NXS</h2>
                            <p className="text-[#10b981] text-[10px] font-bold uppercase tracking-widest mt-0.5">Secure P2P Escrow</p>
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6">
                    {/* Market Data Highlight */}
                    <div className="bg-[#0b1120] rounded-xl p-4 mb-6 border border-slate-700/50 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                        <div className="flex flex-col gap-3 relative z-10">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400 font-medium">Exchange Rate</span>
                                <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded-md text-xs border border-slate-700">1 NXS = {rate} BDT</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400 font-medium">Seller's Balance</span>
                                <span className="font-bold text-white flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5 text-blue-400" /> {liveAvailable} NXS</span>
                            </div>
                            <div className="h-px bg-slate-700/50 w-full my-0.5"></div>
                            <div className="flex justify-between items-center">
                                <span className="text-emerald-400/80 text-xs font-bold uppercase tracking-wider">Available Limit</span>
                                <span className="font-black text-emerald-400 text-lg shadow-emerald-500/50 drop-shadow-md">{maxLimit} NXS</span>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                            Amount to Buy
                        </label>
                        <div className="relative mb-8 group">
                            <input
                                type="number"
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                min="1"
                                max={maxLimit}
                                placeholder={`Enter amount... (Max ${maxLimit})`}
                                className="w-full bg-[#1e293b] border border-slate-600 rounded-xl px-4 py-3.5 text-white font-bold tracking-wide focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-500 text-lg shadow-inner"
                            />
                            <button
                                type="button"
                                onClick={() => setAmount(maxLimit)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg hover:bg-emerald-500 hover:text-white hover:shadow-[0_0_10px_rgba(16,185,129,0.4)] transition-all duration-300"
                            >
                                MAX
                            </button>
                        </div>

                        <div className="flex gap-3">
                            <button type="button" onClick={onClose} className="flex-1 py-3.5 px-4 rounded-xl font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/50 hover:text-white hover:border-slate-500 transition-all duration-200">
                                Cancel
                            </button>
                            <button type="submit" disabled={!amount || Number(amount) <= 0 || Number(amount) > maxLimit} className="flex-1 py-3.5 px-4 rounded-xl font-black bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed">
                                Proceed
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
