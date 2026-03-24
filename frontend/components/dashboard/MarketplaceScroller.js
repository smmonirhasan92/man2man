'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Server, Smartphone, ArrowRight, Shield } from 'lucide-react';

export default function MarketplaceScroller({ plans, onSelect, userBalance }) {
    if (!plans || plans.length === 0) return null;

    const validPlans = plans.filter(p => !p.isHidden);

    return (
        <div className="w-full py-2">
            <div className="flex items-center justify-between px-6 mb-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Globe size={14} className="text-blue-500" /> VPS Server Marketplace
                </h3>
                <span className="text-[10px] font-mono text-blue-400/70">SECURE UPLINK</span>
            </div>

            <div className="flex overflow-x-auto gap-4 px-6 pb-4 no-scrollbar scroll-smooth">
                {validPlans.map((plan) => {
                    const nxsCost = plan.unlock_price || 1000;
                    const usdPrice = (nxsCost / 50).toFixed(2);
                    const isIreland = plan.name.includes("Ireland");
                    const isUSA = plan.name.includes("USA") || plan.name.includes("United");
                    const accentColor = isIreland ? 'emerald' : 'blue';

                    return (
                        <motion.div
                            key={plan.id}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onSelect(plan)}
                            className="flex-shrink-0 w-64 bg-white/5 border border-white/10 rounded-[2rem] p-5 relative overflow-hidden group hover:bg-white/10 transition-all cursor-pointer shadow-2xl backdrop-blur-md"
                        >
                            {/* Decorative Glow */}
                            <div className={`absolute -top-10 -right-10 w-24 h-24 bg-${accentColor}-500/10 blur-3xl rounded-full group-hover:bg-${accentColor}-500/20 transition-all`} />

                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 rounded-2xl bg-${accentColor}-500/10 border border-${accentColor}-500/20 flex items-center justify-center`}>
                                    {plan.type === 'number' ? (
                                        <Smartphone size={24} className={`text-${accentColor}-400`} />
                                    ) : (
                                        <Server size={24} className={`text-${accentColor}-400`} />
                                    )}
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                        ROI: 150%+
                                    </span>
                                    <span className="text-[8px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">Verified Node</span>
                                </div>
                            </div>

                            <h4 className="text-sm font-black text-white uppercase tracking-wide mb-1 flex items-center gap-2">
                                {plan.name}
                                <img 
                                    src={isIreland ? "https://flagcdn.com/ie.svg" : "https://flagcdn.com/us.svg"} 
                                    className="w-3.5 h-2.5 rounded-[1px] opacity-80" 
                                    alt="Flag"
                                />
                            </h4>
                            <p className="text-[10px] text-slate-500 mb-4 font-medium italic">Active Cloud Infrastructure</p>

                            <div className="flex items-end justify-between border-t border-white/10 pt-4">
                                <div>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Pricing</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-lg font-black text-white">${usdPrice}</span>
                                        <span className="text-[10px] text-slate-500">USD</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">NXS Equivalent</p>
                                    <p className="text-[11px] font-bold text-emerald-400">{nxsCost.toLocaleString()} NXS</p>
                                </div>
                            </div>

                            {/* Hover Action */}
                            <div className="mt-4 flex items-center justify-between text-blue-400 group-hover:text-blue-300 transition-colors">
                                <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                    <Shield size={10} /> Secure Deploy
                                </span>
                                <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
