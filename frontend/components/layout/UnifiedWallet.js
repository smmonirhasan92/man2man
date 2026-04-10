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
    const [viewMode, setViewMode] = useState(0); 
    
    const rawBalance = parseFloat(balance || 0);
    const rawIncome = parseFloat(income || 0);
    
    const toggleMode = () => setViewMode((prev) => (prev + 1) % 3);

    return (
        <div 
            onClick={toggleMode}
            className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-4 py-3 backdrop-blur-md shadow-2xl relative overflow-hidden group transition-all hover:bg-white/10 cursor-pointer select-none gap-3"
        >
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 blur-2xl rounded-full group-hover:bg-blue-500/10 transition-colors"></div>
            
            <div className="flex flex-col items-start min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.05em] truncate">
                        {viewMode === 0 ? 'Main Assets' : viewMode === 1 ? 'NXS Balance' : 'Balance'}
                    </span>
                </div>
                <div className="flex flex-col items-start leading-none">
                    <div className="flex items-center gap-1">
                        {viewMode === 0 ? (
                            <span className="text-emerald-400 font-black text-lg font-mono">
                                {formatMoney(rawBalance)}
                            </span>
                        ) : viewMode === 1 ? (
                            <div className="flex items-center gap-1">
                                <USCIcon className="w-4 h-4" />
                                <span className="text-lg font-black text-white font-mono">{rawBalance.toFixed(0)}</span>
                            </div>
                        ) : (
                            <span className="text-lg font-black text-white font-mono">••••••</span>
                        )}
                        {viewMode === 2 && <EyeOff size={10} className="text-slate-500 ml-1" />}
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-end text-right min-w-0">
                <div className="flex items-center justify-end gap-1 mb-1">
                    <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-[0.05em] truncate">
                        Income
                    </span>
                    {viewMode !== 2 && <TrendingUp size={10} className="text-emerald-500" />}
                </div>
                <div className="flex flex-col items-end leading-none">
                    <span className="text-[14px] font-black text-emerald-400 font-mono">
                        {viewMode === 2 ? '••••' : formatMoney(rawIncome)}
                    </span>
                </div>
                <div className="absolute top-1 right-2 text-[6px] text-white/20 font-mono uppercase tracking-tighter">
                    v7.5 PRO
                </div>
            </div>
        </div>
    );
}
