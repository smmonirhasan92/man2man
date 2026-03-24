'use client';
import React, { useState } from 'react';
import { EyeOff, TrendingUp } from 'lucide-react';
import USCIcon from '../ui/USCIcon';

/**
 * Unified Wallet Header (v5 - User Approved Sequence)
 * Sequence: USD (Default) -> NXS (NX Coin) -> Hidden
 */
export default function UnifiedWallet({ balance, income }) {
    // 0: USD Mode (Default), 1: NXS Mode (NX Coin), 2: Hidden
    const [viewMode, setViewMode] = useState(0); 
    
    const rawBalance = parseFloat(balance || 0);
    const rawIncome = parseFloat(income || 0);
    const rate = 50; // 1 USD = 50 NXS
    
    const toggleMode = () => setViewMode((prev) => (prev + 1) % 3);

    // Main Calculations
    const mainUsd = (rawBalance / rate).toFixed(2);
    const mainNxs = rawBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    // Income Calculations
    const incomeUsd = (rawIncome * 0.02).toFixed(2);
    const incomeNxs = rawIncome.toFixed(2);

    return (
        <div 
            onClick={toggleMode}
            className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-2xl p-1 backdrop-blur-md shadow-2xl relative overflow-hidden group transition-all hover:bg-white/10 cursor-pointer select-none min-w-[180px]"
        >
            {/* Subtle Gradient Glow */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 blur-2xl rounded-full group-hover:bg-blue-500/10 transition-colors"></div>
            
            {/* Main Assets Section */}
            <div className="flex-1 px-4 py-2">
                <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em]">
                        {viewMode === 0 ? 'USD Balance' : viewMode === 1 ? 'NXS Balance' : 'Balance'}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {viewMode === 0 ? (
                        <span className="text-emerald-400 font-bold text-base">$</span>
                    ) : viewMode === 1 ? (
                        <USCIcon className="w-4 h-4 mb-0.5" />
                    ) : null}
                    <span className="text-lg font-black text-white font-mono leading-none">
                        {viewMode === 0 ? mainUsd : viewMode === 1 ? mainNxs : '••••••'}
                    </span>
                    {viewMode === 2 && <EyeOff size={12} className="text-slate-500 ml-1" />}
                </div>
            </div>

            {/* Divider */}
            <div className="w-px h-10 bg-white/10"></div>

            {/* Income Section */}
            <div className="flex-1 px-4 py-2 border-l border-white/5">
                <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.1em]">
                        {viewMode === 1 ? 'NXS Income' : 'Income'}
                    </span>
                    {viewMode !== 2 && <TrendingUp size={12} className="text-emerald-500" />}
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-base font-black text-emerald-400 font-mono leading-none">
                        {viewMode === 0 ? `$${incomeUsd}` : viewMode === 1 ? incomeNxs : '••••'}
                    </span>
                </div>
            </div>
        </div>
    );
}
