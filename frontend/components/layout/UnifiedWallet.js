'use client';
import React, { useState } from 'react';
import { EyeOff, TrendingUp } from 'lucide-react';
import USCIcon from '../ui/USCIcon';
import { useCurrency } from '../../context/CurrencyContext';

/**
 * Unified Wallet Header (v7.1 - Cent Normalized)
 * Fixes broken imports and forces 1:1 calculation (1 NX = 1 Cent).
 */
export default function UnifiedWallet({ balance, income }) {
    const { formatMoney } = useCurrency();
    const [viewMode, setViewMode] = useState(0); // 0: USD, 1: NXS
    
    const rawBalance = parseFloat(balance || 0);
    const rawIncome = parseFloat(income || 0);
    
    const toggleMode = (e) => {
        e.stopPropagation();
        setViewMode((prev) => (prev === 0 ? 1 : 0));
    };

    return (
        <div 
            onClick={toggleMode}
            className="flex items-center gap-4 bg-[#0b1221]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-3 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.4)] cursor-pointer hover:border-white/20 transition-all active:scale-95 select-none relative overflow-hidden group"
        >
            {/* Gloss Reflection */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-white/5 rounded-t-2xl pointer-events-none"></div>

            <div className="text-right">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">MAIN ASSETS</p>
                <div className="flex items-center justify-end gap-1.5">
                    {viewMode === 1 && <USCIcon className="w-3 h-3" />}
                    <p className="text-[15px] font-black text-white leading-none font-mono">
                        {viewMode === 0 ? formatMoney(rawBalance) : rawBalance.toFixed(0)}
                    </p>
                </div>
            </div>

            <div className="w-px h-8 bg-white/10"></div>

            <div className="text-right">
                <p className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest mb-1 flex items-center justify-end gap-1">
                    INCOME <TrendingUp size={8} />
                </p>
                <p className="text-[15px] font-black text-emerald-400 leading-none font-mono">
                    {viewMode === 0 ? formatMoney(rawIncome) : rawIncome.toFixed(0)}
                </p>
            </div>
        </div>
    );
}
