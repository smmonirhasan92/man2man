'use client';
import { useState } from 'react';
import { ShieldCheck, AlertTriangle, ChevronRight } from 'lucide-react';

// Method Selection Chip
const MethodChip = ({ selected, onClick, label, color }) => (
    <button
        type="button"
        onClick={onClick}
        className={`
            px-5 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all duration-300 border
            ${selected
                ? `${color} scale-105 shadow-lg`
                : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300'
            }
        `}
    >
        {label}
    </button>
);

// Fee Breakdown Row
const FeeRow = ({ label, value, highlight, isDeduct }) => (
    <div className={`flex items-center justify-between py-2.5 px-4 ${highlight ? 'bg-white/5 rounded-xl' : ''}`}>
        <span className={`text-sm font-medium ${highlight ? 'text-white font-bold' : 'text-zinc-400'}`}>{label}</span>
        <span className={`text-sm font-bold font-mono ${isDeduct ? 'text-red-400' : highlight ? 'text-emerald-400 text-base' : 'text-white'}`}>
            {value}
        </span>
    </div>
);

const METHOD_COLORS = {
    Bkash: 'bg-[#E2136E]/20 text-[#E2136E] border-[#E2136E]/40',
    Nagad: 'bg-[#F37021]/20 text-[#F37021] border-[#F37021]/40',
    Rocket: 'bg-[#8C2982]/20 text-[#8C2982] border-[#8C2982]/40',
    Bank: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
};

export default function WithdrawForm({ balance, onSubmit, loading }) {
    const [form, setForm] = useState({
        amount: '',
        method: 'Bkash',
        tier: 'standard',
        accountDetails: '',
        deliveryTime: '24h'
    });

    // --- Fee Calculation ---
    const usdValue = parseFloat(form.amount) || 0;
    const nxsValue = usdValue * 100;                          // 1 USD = 100 NXS
    const feeUSD = parseFloat((usdValue * 0.035).toFixed(2)); // 3.5% fee
    const feeNXS = feeUSD * 100;
    const totalDeductNXS = nxsValue + feeNXS;
    const youReceiveUSD = usdValue;                           // User gets exactly what they entered

    const hasAmount = usdValue > 0;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.amount || !form.accountDetails) return;

        const idempotencyKey = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        // Send total deduction in NXS to backend
        onSubmit({
            ...form,
            amount: totalDeductNXS,   // Backend deducts total (amount + fee)
            idempotencyKey
        });
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto flex flex-col gap-6 mt-4 animate-in fade-in duration-500">

            {/* 1. Method Selection */}
            <div className="flex flex-wrap justify-center gap-3">
                {['Bkash', 'Nagad', 'Rocket', 'Bank'].map(m => (
                    <MethodChip
                        key={m}
                        label={m}
                        selected={form.method === m}
                        color={METHOD_COLORS[m]}
                        onClick={() => setForm({ ...form, method: m })}
                    />
                ))}
            </div>

            {/* 2. Delivery Time */}
            <div className="flex justify-center gap-3">
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

            {/* 3. Amount Input — Large & Clear */}
            <div className="text-center">
                <div className="text-[11px] text-zinc-500 uppercase tracking-widest font-bold mb-3">
                    Withdrawal Amount (USD)
                </div>
                <div className="relative inline-flex items-center">
                    <span className="text-3xl font-thin text-zinc-600 mr-2">$</span>
                    <input
                        type="number"
                        value={form.amount}
                        onChange={e => setForm({ ...form, amount: e.target.value })}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className="w-44 bg-transparent text-5xl font-thin text-white text-center placeholder-zinc-800 outline-none border-b-2 border-zinc-800 focus:border-zinc-400 transition-colors pb-2"
                        autoFocus
                    />
                    <span className="text-lg font-thin text-zinc-600 ml-2">USD</span>
                </div>
                {hasAmount && (
                    <div className="text-[11px] text-zinc-600 mt-2 font-mono">
                        = {nxsValue.toLocaleString()} NXS
                    </div>
                )}
            </div>

            {/* 4. Fee Breakdown Card — Prominent & Clear */}
            {hasAmount ? (
                <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 overflow-hidden">
                    {/* Card Header */}
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                            Transaction Summary
                        </span>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-zinc-900/80">
                        <FeeRow
                            label="You Withdraw"
                            value={`$${usdValue.toFixed(2)}  (${nxsValue.toLocaleString()} NXS)`}
                        />
                        <FeeRow
                            label="Platform Fee (3.5%)"
                            value={`-$${feeUSD.toFixed(2)}  (-${feeNXS.toLocaleString()} NXS)`}
                            isDeduct={true}
                        />
                        <div className="border-t border-zinc-700/50 mt-1" />
                        <FeeRow
                            label="✅ You Receive"
                            value={`$${youReceiveUSD.toFixed(2)}`}
                            highlight={true}
                        />
                        <FeeRow
                            label="Total Deducted from Wallet"
                            value={`${totalDeductNXS.toLocaleString()} NXS`}
                            isDeduct={true}
                        />
                    </div>

                    {/* Warning */}
                    <div className="flex items-start gap-2 px-4 py-3 border-t border-zinc-800 bg-amber-500/5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-[10px] text-amber-500/80 font-medium leading-relaxed">
                            Your wallet will be debited <strong className="text-amber-400">{totalDeductNXS.toLocaleString()} NXS</strong> (${ (totalDeductNXS / 100).toFixed(2) } USD) including the 3.5% platform fee.
                        </p>
                    </div>
                </div>
            ) : (
                /* Empty State Hint */
                <div className="w-full rounded-2xl border border-dashed border-zinc-800 py-6 text-center">
                    <p className="text-[11px] text-zinc-600 font-mono">Enter an amount to see fee breakdown</p>
                    <p className="text-[10px] text-zinc-700 mt-1">Admin Withdrawal Fee: <span className="text-zinc-500">3.5%</span></p>
                </div>
            )}

            {/* 5. Account Number Input */}
            <div className="w-full">
                <label className="block text-[11px] text-zinc-500 uppercase tracking-widest font-bold mb-2 text-center">
                    {form.method} Account Number
                </label>
                <input
                    type="text"
                    value={form.accountDetails}
                    onChange={e => setForm({ ...form, accountDetails: e.target.value })}
                    placeholder={`Enter your ${form.method} number`}
                    className="w-full bg-zinc-950 text-center py-4 rounded-xl text-white placeholder-zinc-700 outline-none border border-zinc-800 focus:border-zinc-600 focus:bg-zinc-900 transition-all text-sm tracking-widest font-mono"
                />
            </div>

            {/* 6. Submit Button */}
            <button
                type="submit"
                disabled={loading || !form.amount || !form.accountDetails || usdValue <= 0}
                className="group relative w-full py-4 bg-white text-black rounded-2xl font-bold text-sm tracking-widest uppercase hover:bg-zinc-100 hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.4)] transition-all disabled:opacity-20 disabled:cursor-not-allowed active:scale-[0.98]"
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Processing...
                    </span>
                ) : (
                    <span className="flex items-center justify-center gap-2">
                        Confirm Withdrawal
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                )}
            </button>

            {/* Safety Note */}
            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-center space-y-1 pb-4">
                <p className="text-[11px] text-zinc-400 font-medium">
                    🔒 Secured by Man2Man Escrow
                </p>
                <p className="text-xs font-bold text-emerald-400">
                    Your funds will be transferred within 10 minutes to 3 hours.
                </p>
                <p className="text-[10px] text-zinc-600">
                    (আপনার টাকা ১০ মিনিট থেকে ৩ ঘণ্টার মধ্যে পৌঁছে যাবে)
                </p>
            </div>

        </form>
    );
}
