'use client';
import { useState } from 'react';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';

// Minimalist Chips for Methods
const MethodChip = ({ id, selected, onClick, label }) => (
    <button
        type="button"
        onClick={onClick}
        className={`
            px-5 py-2.5 rounded-full text-xs font-medium tracking-wide transition-all duration-300 border
            ${selected
                ? 'bg-white text-black border-white shadow-lg shadow-white/10 scale-105'
                : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300'
            }
        `}
    >
        {label}
    </button>
);

export default function WithdrawForm({ balance, onSubmit, loading }) {
    const { formatMoney } = useCurrency(); // Helper if needed
    const [form, setForm] = useState({
        amount: '',
        method: 'Bkash', // Default
        tier: 'standard',
        accountDetails: '',
        deliveryTime: '24h' // Default
    });

    // Determine Receive Amount (Approx conversion logic if needed, or just 1:1 for BDT)
    // Assuming Input is USD for this "Elegant" view? Or BDT?
    // User asked: "Display USD balance... Input amount... Receive Amount (BDT)..."
    // Implies Input is in USD.
    // Input is now directly in BDT as per user request

    // Main Wallet Balance Only
    // Assuming 'balance' prop is the Main Wallet Balance in BDT.
    // We can display it as USD for the "Elegant" look if needed, or BDT.

    const receiveAmount = form.amount ? parseFloat(form.amount).toLocaleString() : '0';

    const handleSubmit = (e) => {
        e.preventDefault();

        const idempotencyKey = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Input is already in BDT
        const bdtValue = parseFloat(form.amount);

        onSubmit({
            ...form,
            amount: bdtValue,
            idempotencyKey
        });
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto flex flex-col items-center mt-8 space-y-12 animate-in fade-in duration-700">

            {/* 1. Method Selection (Pills) */}
            <div className="flex flex-wrap justify-center gap-3">
                {['Bkash', 'Nagad', 'Rocket', 'Bank'].map(m => (
                    <MethodChip
                        key={m}
                        id={m}
                        label={m}
                        selected={form.method === m}
                        onClick={() => setForm({ ...form, method: m })}
                    />
                ))}
            </div>

            {/* 2. Delivery Time Selection (New) */}
            <div className="flex justify-center gap-4 mt-6">
                {['1h', '24h', '48h', '72h'].map((time) => (
                    <button
                        key={time}
                        type="button"
                        onClick={() => setForm({ ...form, deliveryTime: time })}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all
                            ${form.deliveryTime === time
                                ? 'bg-zinc-800 text-white border border-zinc-600'
                                : 'text-zinc-600 border border-transparent hover:text-zinc-400'
                            }
                        `}
                    >
                        {time}
                    </button>
                ))}
            </div>

            {/* 2. Minimal Input */}
            <div className="w-full relative group text-center">
                <div className="relative inline-block">
                    <span className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 pr-4 text-3xl font-thin text-zinc-600">৳</span>
                    <input
                        type="number"
                        value={form.amount}
                        onChange={e => setForm({ ...form, amount: e.target.value })}
                        placeholder="0.00"
                        className="w-48 bg-transparent text-5xl font-thin text-white text-center placeholder-zinc-800 outline-none border-b border-zinc-800 focus:border-zinc-500 transition-colors pb-2"
                        autoFocus
                    />
                </div>

                {/* Receive Preview (No Fee on Withdraw) */}
                <div className="mt-6 flex flex-col items-center gap-1">
                    <div className="text-sm font-medium text-zinc-500 flex items-center justify-center gap-2">
                        <span>Receive approx</span>
                        <span className="text-emerald-400/80">৳ {receiveAmount}</span>
                    </div>
                    {/* Fee Label */}
                    <span className="text-[10px] text-zinc-700 font-mono tracking-wide">
                        Fee: 0% (Standard) • Deducted from Main Wallet
                    </span>
                </div>
            </div>

            {/* 3. Account Input (Ghost) */}
            <div className="w-full">
                <input
                    type="text"
                    value={form.accountDetails}
                    onChange={e => setForm({ ...form, accountDetails: e.target.value })}
                    placeholder="Enter Account Number"
                    className="w-full bg-[#0F0F0F] text-center py-4 rounded-xl text-zinc-400 placeholder-zinc-700 outline-none border border-transparent focus:border-zinc-800 focus:bg-[#141414] transition-all text-sm tracking-wide"
                />
            </div>

            {/* 4. Action Button */}
            <button
                type="submit"
                disabled={loading || !form.amount || !form.accountDetails}
                className="group relative px-8 py-4 bg-zinc-100 text-black rounded-full font-bold text-sm tracking-widest uppercase hover:px-10 hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] transition-all disabled:opacity-20 disabled:hover:px-8 disabled:cursor-not-allowed"
            >
                {loading ? 'Processing...' : 'Withdraw Funds'}
            </button>

        </form>
    );
}
