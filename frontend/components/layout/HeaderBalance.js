'use client';
import React, { useState } from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import USCIcon from '../ui/USCIcon';

/**
 * Header Balance Component (v7.1 - Cent Normalized)
 * Fixes imports and confirms 1 NXS = 1 Cent calculation.
 */
export default function HeaderBalance({ balance }) {
    const { formatMoney } = useCurrency();
    // State: 0 = Hidden, 1 = USD (Default), 2 = NXS
    const [viewState, setViewState] = useState(1);

    const rawBalance = parseFloat(balance || 0);

    const handleToggle = (e) => {
        e.stopPropagation(); 
        setViewState((prev) => (prev + 1) % 3);
    };

    // Calculate Display Content
    let displayValue, currencySymbol;

    if (viewState === 0) {
        displayValue = '••••••';
        currencySymbol = '';
    } else if (viewState === 1) {
        // [v7.0] USD Only Display (Normalized to $0.01 per NXS)
        displayValue = (
            <span className="text-emerald-400 font-bold text-lg font-mono leading-none">
                {formatMoney(rawBalance)}
            </span>
        );
        currencySymbol = null;
    } else {
        // NXS Mode
        displayValue = rawBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        currencySymbol = <USCIcon className="w-5 h-5" />;
    }

    return (
        <div
            onClick={handleToggle}
            className="group relative flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer backdrop-blur-md select-none min-w-[140px] justify-between shadow-lg"
        >
            <div className="flex flex-col">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                    Main Balance
                </span>
                <div className="flex items-center gap-1.5 text-slate-100">
                    <span className="flex items-center justify-center">
                        {currencySymbol}
                    </span>
                    <span className="text-lg font-black font-mono tracking-tight leading-none text-white">
                        {displayValue}
                    </span>
                </div>
            </div>
        </div>
    );
}
