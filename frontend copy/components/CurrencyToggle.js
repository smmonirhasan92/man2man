'use client';
import { useCurrency } from '../context/CurrencyContext';

export default function CurrencyToggle() {
    const { currency, toggleCurrency } = useCurrency();

    return (
        <button
            onClick={toggleCurrency}
            className="flex items-center gap-1 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs font-bold text-white hover:bg-white/20 transition backdrop-blur-md"
        >
            <span className={currency === 'USD' ? 'text-green-400' : 'text-slate-400'}>$</span>
            <span className="w-px h-3 bg-white/20 mx-0.5"></span>
            <span className={currency === 'BDT' ? 'text-green-400' : 'text-slate-400'}>৳</span>
        </button>
    );
}
