import React from 'react';
import { useCurrency } from '../../context/CurrencyContext'; // [NEW] Centralized Currency

export default function IncomeDisplay({ amount }) {
    const { formatMoney } = useCurrency();
    const displayValue = formatMoney(amount);

    return (
        <div className="flex flex-col items-end mr-1">
            <span className="text-[9px] text-green-400 font-bold uppercase tracking-wider mb-0.5">
                Income
            </span>
            <div className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 backdrop-blur-md">
                <span className="text-sm font-black font-mono text-green-400">
                    {displayValue}
                </span>
            </div>
        </div>
    );
}
