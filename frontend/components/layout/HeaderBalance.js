import React, { useState } from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import USCIcon from '../ui/USCIcon';

export default function HeaderBalance({ balance }) {
    const { formatMoney } = useCurrency();
    // State: 0 = Hidden, 1 = USD, 2 = BDT
    const [viewState, setViewState] = useState(0);

    const rawBalance = parseFloat(balance || 0); // Always BDT (e.g. 10000)
    const rate = 120; // 1 USD = 120 BDT

    const handleToggle = (e) => {
        e.stopPropagation(); // Prevent deposit click
        setViewState((prev) => (prev + 1) % 3);
    };

    const handleDeposit = () => {
        window.location.href = '/wallet/recharge';
    };

    // Calculate Display Content
    let displayValue, currencySymbol, currencyLabel;

    if (viewState === 0) {
        displayValue = '••••••';
        currencySymbol = '';
        currencyLabel = 'Hidden';
    } else if (viewState === 1) {
        // USD Mode
        displayValue = (rawBalance / rate).toFixed(2);
        currencySymbol = '$';
        currencyLabel = 'USD';
    } else {
        // USC Mode
        displayValue = rawBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        currencySymbol = <USCIcon className="w-5 h-5" />;
        currencyLabel = 'USC';
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
                    <span className={`flex items-center justify-center ${viewState === 1 ? 'text-green-400 font-bold' : ''}`}>
                        {currencySymbol}
                    </span>
                    <span className="text-lg font-black font-mono tracking-tight leading-none text-white">
                        {displayValue}
                    </span>
                </div>
            </div>

            {/* Tiny Deposit Button */}

        </div>
    );
}
