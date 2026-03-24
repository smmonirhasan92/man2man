'use client';
import React, { useState } from 'react';
import { Eye, EyeOff, TrendingUp, Wallet } from 'lucide-react';

/**
 * Unified Wallet Header
 * Consolidates Main Balance and Income into a single premium card.
 */
export default function UnifiedWallet({ balance, income }) {
    const [isVisible, setIsVisible] = useState(false);
    
    const rawBalance = parseFloat(balance || 0);
    const rawIncome = parseFloat(income || 0);
    const rate = 50; // 1 USD = 50 NXS

    // Calculation: (USD Value)
    const mainUsd = (rawBalance / rate).toFixed(2);
    const incomeUsd = (rawIncome * 0.02).toFixed(2); // Consistent with IncomeDisplay

    return (
        <div className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-2xl p-1 backdrop-blur-md shadow-2xl relative overflow-hidden group transition-all hover:bg-white/10">
            {/* Subtle Gradient Glow */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 blur-2xl rounded-full group-hover:bg-blue-500/10 transition-colors"></div>
            
            {/* Main Balance Section */}
            <div 
                className="flex-1 px-4 py-2 cursor-pointer select-none"
                onClick={() => setIsVisible(!isVisible)}
            >
                <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.1em]">Assets</span>
                    {isVisible ? <EyeOff size={10} className="text-slate-500" /> : <Eye size={10} className="text-slate-500" />}
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-sm font-black text-white font-mono">
                        {isVisible ? `$${mainUsd}` : '••••••'}
                    </span>
                </div>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-white/10"></div>

            {/* Income Section */}
            <div className="flex-1 px-4 py-2 border-l border-white/5">
                <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-[0.1em]">Gains</span>
                    <TrendingUp size={10} className="text-emerald-500" />
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-sm font-black text-emerald-400 font-mono">
                        ${incomeUsd}
                    </span>
                </div>
            </div>
        </div>
    );
}
