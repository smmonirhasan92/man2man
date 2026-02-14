'use client';
import { Server, Shield, CheckCircle, Smartphone, TrendingUp, Clock, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ServerCard({ plan, onRent }) {
    // Determine visuals based on keyword matching
    const isIreland = plan.name.includes("Ireland");
    const isCanada = plan.name.includes("Canada");
    const isUSA = plan.name.includes("US");

    let flagUrl = "https://flagcdn.com/us.svg";
    let bgGradient = "from-slate-800 to-slate-900";
    let border = "border-slate-700";

    if (isIreland) {
        flagUrl = "https://flagcdn.com/ie.svg";
        bgGradient = "from-emerald-900 via-green-950 to-slate-900";
        border = "border-emerald-500/50";
    } else if (isCanada) {
        flagUrl = "https://flagcdn.com/ca.svg";
        bgGradient = "from-red-900 via-rose-950 to-slate-900";
        border = "border-red-500/50";
    } else {
        // USA (Blue)
        bgGradient = "from-blue-900 via-indigo-950 to-slate-900";
        border = "border-blue-500/50";
    }

    // Dynamic Features Parsing
    const profitTier = plan.features.find(f => f.includes("Profit Tier"))?.split(": ")[1] || "Standard";
    const recovery = plan.features.find(f => f.includes("Capital Recovery"))?.split(": ")[1] || "16 Days";

    // Currency Formatting (Exact user requirement: $10.50 / ৳1266.83)
    const usdPrice = (plan.unlock_price / 120.65).toFixed(2);
    const bdtPrice = plan.unlock_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            className={`relative h-full rounded-2xl overflow-hidden border ${border} bg-gradient-to-b ${bgGradient} backdrop-blur-md bg-opacity-90 shadow-2xl flex flex-col`}
        >
            {/* Header / Flag */}
            <div className="relative p-8 flex justify-between items-start">
                <div className="flex items-center gap-4">
                    <img src={flagUrl} alt="Flag" className="w-14 h-9 rounded-md shadow-lg object-cover" />
                    <div>
                        <h3 className="text-white font-bold text-2xl leading-tight">{plan.name}</h3>
                        <p className="text-xs text-white/50 mt-1 font-mono tracking-wide">NODE ID: {Math.floor(Math.random() * 90000) + 10000}</p>
                    </div>
                </div>
                <div className="text-right">
                    {plan.name.includes("Monarch") && <span className="text-3xl mr-1">👑</span>}
                    {plan.daily_limit <= 12 && (
                        <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-1 rounded border border-emerald-500/30 block mt-1 animate-pulse tracking-widest uppercase">
                            High Efficiency
                        </span>
                    )}
                </div>
            </div>

            {/* Price & Income (Dual Currency) */}
            <div className="px-8 py-6 border-t border-white/5 border-b border-white/5 bg-black/20 flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Monthly Rent</span>
                    <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-3xl font-black text-white leading-none">${usdPrice}</span>
                        <span className="text-lg text-slate-500 font-medium">/ ৳{bdtPrice}</span>
                    </div>
                </div>

                <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Est. Revenue</span>
                    <span className="text-xl font-bold text-emerald-300 leading-none">
                        ${(plan.task_reward * plan.daily_limit).toFixed(2)} <span className="text-sm text-emerald-500/80">/day</span>
                    </span>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="px-8 py-5 grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col justify-center">
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mb-1 font-bold uppercase whitespace-nowrap">
                        <TrendingUp size={12} /> Profit Share
                    </p>
                    <p className="text-base font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis">
                        {plan.features.find(f => f.includes("Profit Share"))?.split(": ")[1] || "70%"}
                    </p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col justify-center">
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 mb-1 font-bold uppercase whitespace-nowrap">
                        <Clock size={12} /> Total Return
                    </p>
                    <p className="text-base font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis">
                        {plan.features.find(f => f.includes("Total Return"))?.split(": ")[1] || "Calculated"}
                    </p>
                </div>
            </div>

            {/* Features List */}
            <div className="px-8 flex-1 space-y-4">
                <div className="flex items-center gap-3 text-sm font-bold text-white bg-slate-800/60 p-3 rounded-xl border border-white/10 shadow-inner">
                    <CheckCircle size={18} className="text-emerald-400 shrink-0" />
                    <span>Daily Work: {plan.daily_limit} Tasks</span>
                </div>
                {plan.features.slice(0, 3).map((feat, idx) => {
                    if (feat.includes("Capital") || feat.includes("Profit") || feat.includes("Maintenance")) return null;
                    return (
                        <div key={idx} className="flex items-start gap-3 text-sm text-slate-300 px-1">
                            <CheckCircle size={16} className="text-blue-400 shrink-0 mt-0.5" />
                            <span>{feat.replace(/.*Features: /, "")}</span>
                        </div>
                    );
                })}
                <div className="flex items-start gap-3 text-[11px] text-slate-500 px-1 mt-2">
                    <Info size={14} className="shrink-0 mt-0.5" />
                    <span>26 Working Days + 4 Server Maintenance Days</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-slate-300 px-1 mt-2 border-t border-white/5 pt-2">
                    <Smartphone size={16} className="text-purple-400 shrink-0 mt-0.5" />
                    <span>Dedicated Virtual Number</span>
                </div>
            </div>

            {/* Action (Sticks to Bottom) */}
            <div className="px-8 pb-8 pt-6 mt-auto">
                <button
                    onClick={() => onRent(plan.id || plan._id)}
                    className="w-full py-4 rounded-xl bg-white text-slate-900 font-black text-lg hover:bg-slate-200 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                    <Server size={20} />
                    RENT SERVER
                </button>
            </div>
        </motion.div>
    );
}
