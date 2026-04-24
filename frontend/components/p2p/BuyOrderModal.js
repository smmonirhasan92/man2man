import React, { useState } from 'react';
import { X, DollarSign, Wallet } from 'lucide-react';

export default function BuyOrderModal({ isOpen, onClose, order, onConfirm, currentUserBalance = 0 }) {
    const [amount, setAmount] = useState('');
    const [takerPaymentDetails, setTakerPaymentDetails] = useState('');
    const [takerTransactionType, setTakerTransactionType] = useState('SEND_MONEY');
    const [takerAccountType, setTakerAccountType] = useState('Personal'); // [NEW]

    if (!isOpen || !order) return null;

    // Logic: 
    // If order type is SELL, we are BUYING. The limit is the SELLER'S (order creator) balance.
    // If order type is BUY, we are SELLING. The limit is OUR (current user) balance.
    const liveAvailable = order.type === 'SELL' ? (order.userId?.wallet?.main || 0) : currentUserBalance;
    const rate = order.rate || 1.3; // Fallback if no rate
    const maxLimit = Math.min(order.amount, liveAvailable);

    const handleSubmit = (e) => {
        e.preventDefault();
        const numAmount = Number(amount);
        if (numAmount > 0 && numAmount <= maxLimit) {
            // Prefix Logic for Taker
            let finalTakerDetails = takerPaymentDetails;
            const pm = order.paymentMethod?.toLowerCase() || '';
            if (['bkash', 'nagad', 'rocket'].includes(pm)) {
                finalTakerDetails = `[${takerAccountType}] ${takerPaymentDetails}`;
            }

            onConfirm(numAmount, finalTakerDetails, takerTransactionType);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#020617]/80 backdrop-blur-md p-4 animate-fade-in font-sans">
            <div className="bg-[#0f172a] border border-slate-700/50 w-full max-w-sm rounded-[24px] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden animate-slide-up relative max-h-[90vh] flex flex-col">

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
                            <h2 className="text-lg font-black text-white tracking-wide uppercase">
                                {order.type === 'SELL' ? 'Buy NXS' : 'Sell NXS'}
                            </h2>
                            <p className="text-[#10b981] text-[10px] font-bold uppercase tracking-widest mt-0.5">Secure P2P Escrow</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Body */}
                    <div className="p-6">
                        {/* Market Data Highlight */}
                        <div className="bg-[#0b1120] rounded-xl p-4 mb-6 border border-slate-700/50 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                            <div className="flex flex-col gap-3 relative z-10">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400 font-medium">Exchange Rate</span>
                                    <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded-md text-xs border border-slate-700">$1 USD (100 NXS) = {rate} BDT</span>
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

                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-xl mb-4 text-center">
                            <p className="text-[10px] text-yellow-400 font-bold uppercase tracking-wide">
                                <span className="text-yellow-500 text-sm">💡</span> Note: NXS is pegged to USD. The P2P Exchange Rate determines how much local currency (e.g., BDT) you pay per USD.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                                Amount to {order.type === 'SELL' ? 'Buy' : 'Sell'}
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

                            {/* Quick Select Buttons */}
                            <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
                                {[500, 1000, 2000, 5000].map(val => (
                                    val <= maxLimit && (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setAmount(val)}
                                            className={`flex-1 min-w-[70px] py-2 rounded-lg border text-xs font-bold transition-all ${Number(amount) === val ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                                        >
                                            {val} NXS
                                        </button>
                                    )
                                ))}
                            </div>

                            {order.type === 'BUY' && (
                                <div className="mb-8 group">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                                        Your Receiving Account ({order.paymentMethod})
                                    </label>
                                    
                                    {['bkash', 'nagad', 'rocket'].includes(order.paymentMethod?.toLowerCase()) && (
                                        <div className="flex bg-[#0b1120] p-1 rounded-xl border border-slate-700/50 mb-3 relative">
                                            {['Personal', 'Agent', 'Merchant'].map(t => (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => setTakerAccountType(t)}
                                                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${takerAccountType === t ? 'bg-slate-700 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className="space-y-1">
                                        <input
                                            type="text"
                                            required
                                            value={takerPaymentDetails}
                                            onChange={(e) => setTakerPaymentDetails(e.target.value)}
                                            placeholder={order.paymentMethod?.toLowerCase().includes('binance') ? "Binance Pay ID / Email" : `Enter your ${order.paymentMethod} number...`}
                                            className="w-full bg-[#1e293b] border border-slate-600 rounded-xl px-4 py-3 text-white font-bold tracking-wide focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-500 shadow-inner"
                                        />
                                    </div>

                                    <div className="flex bg-[#0b1120] p-1 rounded-xl border border-slate-700/50 mt-3 relative">
                                        <button
                                            type="button"
                                            onClick={() => setTakerTransactionType('SEND_MONEY')}
                                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${takerTransactionType === 'SEND_MONEY' ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
                                        >
                                            Send Money
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTakerTransactionType('CASH_OUT')}
                                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${takerTransactionType === 'CASH_OUT' ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
                                        >
                                            Cash Out
                                        </button>
                                    </div>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-2 px-1">The Buyer will send {order.fiatCurrency || 'BDT'} to this account.</p>
                                </div>
                            )}

                            {/* LIVE CALCULATION DISPLAY */}
                            {amount && Number(amount) > 0 && (
                                <div className="mb-6 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="p-3 bg-emerald-500/10 rounded-xl flex justify-between items-center border border-emerald-500/20 shadow-inner">
                                        <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Rate (1 NXS):</span>
                                        <span className="text-sm font-black text-emerald-400">
                                            {(Number(rate) / 100).toFixed(2)} <span className="text-[10px]">{order.fiatCurrency || 'BDT'}</span>
                                        </span>
                                    </div>
                                    <div className="p-3 bg-[#0b1120] rounded-xl flex justify-between items-center border border-slate-700/50 shadow-2xl">
                                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                            Total {order.type === 'SELL' ? 'To Pay' : 'To Receive'}:
                                        </span>
                                        <span className="text-lg font-black text-white">
                                            {((Number(amount) / 100) * Number(rate)).toLocaleString('en-IN', { maximumFractionDigits: 2 })} <span className="text-[10px] text-slate-400">{order.fiatCurrency || 'BDT'}</span>
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button type="button" onClick={onClose} className="flex-1 py-3.5 px-4 rounded-xl font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/50 hover:text-white hover:border-slate-500 transition-all duration-200">
                                    Cancel
                                </button>
                                <button type="submit" disabled={!amount || Number(amount) <= 0 || Number(amount) > maxLimit} className="flex-1 py-3.5 px-4 rounded-xl font-black bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed">
                                    Proceed
                                </button>
                            </div>
                            <div className="h-10"></div> {/* Bottom Clearance */}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
