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
    const mainNxs = rawBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    // Income Calculations
    const incomeUsd = (rawIncome * 0.02).toFixed(2);
    const incomeNxs = rawIncome.toFixed(2);

    return (
        <div 
            onClick={toggleMode}
            className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-3 py-2.5 backdrop-blur-md shadow-2xl relative overflow-hidden group transition-all hover:bg-white/10 cursor-pointer select-none"
        >
            {/* Subtle Gradient Glow */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 blur-2xl rounded-full group-hover:bg-blue-500/10 transition-colors"></div>
            
            {/* Main Assets Section */}
            <div className="flex flex-col items-start w-1/2">
                <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.05em] truncate">
                        {viewMode === 0 ? 'USD Balance' : viewMode === 1 ? 'NXS Balance' : 'Balance'}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {viewMode === 0 ? (
                        <span className="text-emerald-400 font-bold text-[15px]">$</span>
                    ) : viewMode === 1 ? (
                        <USCIcon className="w-3.5 h-3.5" />
                    ) : null}
                    <span className="text-base font-black text-white font-mono leading-none tracking-tight">
                        {viewMode === 0 ? mainUsd : viewMode === 1 ? mainNxs : '••••••'}
                    </span>
                    {viewMode === 2 && <EyeOff size={10} className="text-slate-500 ml-1" />}
                </div>
            </div>

            {/* Income Section */}
            <div className="flex flex-col items-end text-right w-1/2">
                <div className="flex items-center justify-end gap-1 mb-1">
                    <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-[0.05em] truncate">
                        {viewMode === 1 ? 'NXS Incom' : 'Income'}
                    </span>
                    {viewMode !== 2 && <TrendingUp size={10} className="text-emerald-500" />}
                </div>
                <div className="flex items-center justify-end gap-1">
                    <span className="text-[14px] font-black text-emerald-400 font-mono leading-none tracking-tight">
                        {viewMode === 0 ? `$${incomeUsd}` : viewMode === 1 ? incomeNxs : '••••'}
                    </span>
                </div>
                {/* Version Tag */}
                <div className="absolute top-1 right-2 text-[6px] text-white/20 font-mono uppercase tracking-tighter">
                    v7.2
                </div>
            </div>
        </div>
    );
}
