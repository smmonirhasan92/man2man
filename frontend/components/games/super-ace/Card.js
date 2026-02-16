'use client';
import React from 'react';
import { Crown, Diamond, Club, Spade, Heart, Shield, Gem, Star } from 'lucide-react';

const Card = React.memo(({ symbol, isGold, isWild, className }) => {
    // 1. Normalize Symbol
    let value = symbol;
    if (!value || value === '?') {
        return (
            <div className={`w-full h-full bg-slate-800/80 rounded-lg border-2 border-slate-700/50 flex items-center justify-center relative overflow-hidden ${className}`}>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] opacity-20"></div>
                <div className="text-slate-600 font-bold text-2xl animate-pulse">?</div>
            </div>
        );
    }

    if (value.startsWith('GOLD_')) {
        isGold = true;
        value = value.replace('GOLD_', '');
    }
    if (value === 'WILD') {
        isWild = true;
        value = 'WILD';
    }

    // 2. determine Color & Icon
    const isRed = ['heart', 'diamond', 'Q', 'A'].includes(value); // Simplified Red Logic for visuals
    const textColor = isRed ? 'text-rose-600' : 'text-slate-900';

    // Icon Mapping
    const getIcon = (val, size = "w-6 h-6") => {
        switch (val) {
            case 'spade': return <Spade className={`${size} fill-current`} />;
            case 'heart': return <Heart className={`${size} fill-current`} />;
            case 'club': return <Club className={`${size} fill-current`} />;
            case 'diamond': return <Diamond className={`${size} fill-current`} />;
            case 'SCATTER': return <Crown className={`${size} text-yellow-300 drop-shadow-md`} />;
            case 'WILD': return <Star className={`${size} text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]`} />;
            // Face Cards
            case 'J': return <Shield className={`${size} opacity-80`} />;
            case 'Q': return <Gem className={`${size} opacity-80`} />;
            case 'K': return <Crown className={`${size} opacity-80`} />;
            case 'A': return <Spade className={`${size} opacity-80`} />; // Ace usually associated with Spade in logo
            default: return null;
        }
    };

    // 3. Background Styles
    let bgStyle = "bg-slate-100"; // Default White/Grey Paper
    let borderStyle = "border-slate-300";
    let overlay = null;

    if (isGold) {
        // Gold Foil Effect
        bgStyle = "bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 shadow-[inset_0_0_10px_rgba(253,224,71,0.5)]";
        borderStyle = "border-yellow-600";
        overlay = <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-50 animate-shimmer"></div>;
    } else if (value === 'SCATTER') {
        // Scatter / Bonus
        bgStyle = "bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900";
        borderStyle = "border-purple-400";
    } else if (isWild) {
        // Wild Card
        bgStyle = "bg-gradient-to-br from-rose-600 via-purple-600 to-blue-600";
        borderStyle = "border-white/50";
    }

    return (
        <div className={`w-full h-full p-1 perspective-1000 ${className}`}>
            <div className={`
                w-full h-full rounded-lg relative overflow-hidden shadow-md flex flex-col justify-between p-1.5 transition-transform duration-200
                ${bgStyle} border ${borderStyle}
            `}>
                {overlay}

                {/* --- TOP LEFT RANK --- */}
                {value !== 'SCATTER' && value !== 'WILD' && (
                    <div className="flex flex-col items-center leading-none">
                        <span className={`text-sm font-black ${textColor} font-serif`}>
                            {['spade', 'heart', 'club', 'diamond'].includes(value) ? '' : value}
                        </span>
                        <div className={`mt-0.5 ${textColor}`}>
                            {getIcon(value, "w-3 h-3")}
                        </div>
                    </div>
                )}

                {/* --- CENTER ART --- */}
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    {value === 'SCATTER' ? (
                        <div className="flex flex-col items-center animate-pulse">
                            <Crown className="w-10 h-10 text-yellow-300 fill-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
                            <span className="text-[10px] font-bold text-white mt-1 uppercase tracking-wider">Free Spin</span>
                        </div>
                    ) : isWild ? (
                        <div className="flex flex-col items-center">
                            <div className="relative">
                                <Star className="w-12 h-12 text-white fill-white blur-[1px] absolute top-0 left-0 animate-spin-slow" />
                                <Star className="w-12 h-12 text-yellow-100 fill-white relative z-10" />
                            </div>
                            <span className="text-xs font-black text-white mt-1 tracking-widest drop-shadow-md">WILD</span>
                        </div>
                    ) : (
                        // Standard Rank/Suit Center
                        <div className={`transform scale-150 ${textColor}`}>
                            {['J', 'Q', 'K'].includes(value) ? (
                                // Face Card Avatar
                                <div className={`w-12 h-12 rounded-full border-2 ${isRed ? 'border-rose-400 bg-rose-100' : 'border-slate-400 bg-slate-200'} flex items-center justify-center shadow-inner`}>
                                    {getIcon(value, "w-8 h-8")}
                                </div>
                            ) : (
                                // Number/Suit
                                getIcon(value, "w-10 h-10") || <span className="text-4xl font-serif font-black">{value}</span>
                            )}
                        </div>
                    )}
                </div>

                {/* --- BOTTOM RIGHT RANK (Rotated) --- */}
                {value !== 'SCATTER' && value !== 'WILD' && (
                    <div className="flex flex-col items-center leading-none rotate-180 self-end">
                        <span className={`text-sm font-black ${textColor} font-serif`}>
                            {['spade', 'heart', 'club', 'diamond'].includes(value) ? '' : value}
                        </span>
                        <div className={`mt-0.5 ${textColor}`}>
                            {getIcon(value, "w-3 h-3")}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

export default Card;
