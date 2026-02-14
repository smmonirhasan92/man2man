'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Sparkles } from 'lucide-react';

const SUITS = {
    spade: { symbol: '♠', color: 'text-slate-900', icon: 'bg-slate-900' },
    heart: { symbol: '♥', color: 'text-red-600', icon: 'bg-red-600' },
    club: { symbol: '♣', color: 'text-slate-900', icon: 'bg-slate-900' },
    diamond: { symbol: '♦', color: 'text-red-600', icon: 'bg-red-600' }
};

const Card = React.memo(({ symbol, isGold, isWild }) => {

    // 1. Normalize Symbol
    let type = 'rank';
    let value = symbol;

    if (value.startsWith('GOLD_')) {
        isGold = true;
        value = value.replace('GOLD_', '');
    }

    if (value === 'WILD') {
        isWild = true;
        value = 'W';
    }

    // Check if it's a Suit Symbol (Low Pay)
    if (['spade', 'heart', 'club', 'diamond'].includes(value)) {
        type = 'suit';
    } else if (value === 'SCATTER') {
        type = 'scatter';
    }

    // colors
    const isRed = ['heart', 'diamond', 'Q', 'A'].includes(value) && type !== 'suit' && type !== 'scatter';
    const textColor = isRed ? 'text-red-600' : 'text-slate-900';

    return (
        <div className="w-full h-full p-1">
            <div
                className={`
                    w-full h-full rounded-lg flex flex-col items-center justify-center relative overflow-hidden
                    ${isGold
                        ? 'bg-yellow-200 border-2 border-yellow-500' // Simple Flat Gold
                        : type === 'scatter'
                            ? 'bg-indigo-900 border-2 border-indigo-500 text-white' // Simple Scatter
                            : 'bg-white border border-slate-300'} // Simple Rank
                `}
            >
                {/* --- CONTENT --- */}

                {/* 1. SCATTER */}
                {type === 'scatter' && (
                    <div className="flex flex-col items-center justify-center">
                        <Crown className="w-8 h-8 text-yellow-400" />
                        <span className="text-[10px] font-bold uppercase mt-1">Free Spin</span>
                    </div>
                )}

                {/* 2. SUIT CARDS (Low Pay) */}
                {type === 'suit' && (
                    <div className={`text-4xl ${SUITS[value].color}`}>
                        {SUITS[value].symbol}
                    </div>
                )}

                {/* 3. RANK CARDS (High Pay) */}
                {type === 'rank' && !isWild && (
                    <div className="w-full h-full flex flex-col justify-between p-1">
                        <div className={`text-sm font-bold leading-none ${textColor}`}>
                            {value}
                        </div>
                        <div className={`absolute inset-0 flex items-center justify-center ${textColor}`}>
                            <span className="text-4xl font-bold">{value}</span>
                        </div>
                        <div className={`text-sm font-bold leading-none ${textColor} rotate-180 self-end`}>
                            {value}
                        </div>
                    </div>
                )}

                {/* 4. WILD CARD */}
                {isWild && (
                    <div className="absolute inset-0 bg-purple-700 flex items-center justify-center">
                        <span className="font-bold text-sm text-white tracking-widest">WILD</span>
                    </div>
                )}
            </div>
        </div>
    );
});

export default Card;
