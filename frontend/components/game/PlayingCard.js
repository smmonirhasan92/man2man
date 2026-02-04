import React from 'react';

const SUITS = {
    'S': { symbol: '♠', color: 'text-slate-900' },
    'H': { symbol: '♥', color: 'text-red-500' },
    'D': { symbol: '♦', color: 'text-red-500' },
    'C': { symbol: '♣', color: 'text-slate-900' }
};

/**
 * pure-css-card: A zero-image, lightweight card component.
 * @param {string} rank - A, 2-10, J, Q, K
 * @param {string} suit - S, H, D, C
 * @param {boolean} hidden - If true, shows card back
 */
const PlayingCard = ({ rank, suit, hidden, className = "" }) => {
    if (hidden) {
        return (
            <div className={`w-16 h-24 md:w-20 md:h-28 bg-blue-900 rounded-lg border-2 border-white/20 shadow-xl flex items-center justify-center relative overflow-hidden ${className}`}>
                <div className="absolute inset-0 bg-[url('/bg-pattern.svg')] opacity-20"></div>
                <div className="w-10 h-10 rounded-full border-2 border-white/10 flex items-center justify-center">
                    <span className="text-white/20 font-bold text-xl">?</span>
                </div>
            </div>
        );
    }

    const { symbol, color } = SUITS[suit] || SUITS['S'];

    return (
        <div className={`w-16 h-24 md:w-20 md:h-28 bg-white rounded-lg shadow-xl relative select-none flex flex-col justify-between p-1.5 transition-transform hover:-translate-y-1 ${className}`}>
            {/* Top Corner */}
            <div className={`text-sm font-bold leading-none ${color} flex flex-col items-center`}>
                <span>{rank}</span>
                <span className="text-xs">{symbol}</span>
            </div>

            {/* Center Symbol (Big) */}
            <div className={`absolute inset-0 flex items-center justify-center ${color}`}>
                <span className="text-4xl md:text-5xl opacity-90">{symbol}</span>
            </div>

            {/* Bottom Corner (Rotated) */}
            <div className={`text-sm font-bold leading-none ${color} flex flex-col items-center rotate-180`}>
                <span>{rank}</span>
                <span className="text-xs">{symbol}</span>
            </div>
        </div>
    );
};

export default PlayingCard;
