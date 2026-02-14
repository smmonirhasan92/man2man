"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { User, Cpu } from 'lucide-react';
import PlayingCard from '../PlayingCard';

const PlayerSeat = ({ player, position, isTurn, isActive, shouldReveal }) => {
    // Position styles mapping
    const positionStyles = {
        0: "bottom-4 left-1/2 -translate-x-1/2", // User (Bottom Center)
        1: "bottom-24 right-4", // Right Bottom
        2: "top-20 right-12",   // Right Top
        3: "top-20 left-12",    // Left Top
        4: "bottom-24 left-4",  // Left Bottom
    };

    const isUser = position === 0;

    // Card Visibility Logic
    // User: Visible if 'isSeen' is true. Hidden otherwise (Blind).
    // Bot: Hidden unless 'shouldReveal' (Showdown/End) is true.
    let showCards = false;
    if (isUser) {
        showCards = player.isSeen;
    } else {
        showCards = shouldReveal;
    }

    return (
        <div className={`absolute ${positionStyles[position]} flex flex-col items-center transition-all duration-300 ${!isActive ? 'opacity-50 grayscale' : 'opacity-100'}`}>

            {/* Cards Area */}
            <div className="relative h-24 w-32 mb-4 flex justify-center items-center">
                {player.cards && player.cards.map((card, idx) => (
                    <div key={idx} className="absolute transition-all duration-500" style={{
                        left: `${idx * 20}px`,
                        zIndex: idx,
                        transform: `rotate(${(idx - 1) * 5}deg)`
                    }}>
                        <PlayingCard
                            rank={card.rank}
                            suit={card.suit}
                            hidden={!showCards}
                            className={`shadow-lg border border-white/10 ${!isUser && !showCards ? 'scale-75' : ''}`}
                        />
                    </div>
                ))}
                {(!player.cards || player.cards.length === 0) && isActive && (
                    <div className="text-xs text-white/40 italic">Waiting...</div>
                )}
            </div>

            {/* Avatar & Info */}
            <div className={`relative flex flex-col items-center group`}>

                {/* Network Lag Indicator */}
                {player.isLagging && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-bold px-2 py-1 rounded-md shadow-lg z-30 flex items-center gap-1"
                    >
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                        Slow Net
                    </motion.div>
                )}

                {/* Deal Button / Coin Status Bubble */}
                {player.action && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute -top-8 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded-full border border-yellow-500/50 whitespace-nowrap z-20"
                    >
                        {player.action}
                    </motion.div>
                )}

                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full border-[3px] flex items-center justify-center relative bg-slate-900 shadow-lg
          ${isTurn ? 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.6)]' : 'border-slate-600'}
          ${player.isFolded ? 'opacity-60 ring-2 ring-red-500' : ''}
        `}>
                    {isUser ? <User className="w-6 h-6 text-cyan-400" /> : <Cpu className="w-6 h-6 text-pink-500" />}

                    {/* Dealer Button Placeholder (if needed later) */}
                    {player.isDealer && (
                        <div className="absolute -right-1 -bottom-1 w-5 h-5 bg-white text-black font-bold text-[10px] rounded-full flex items-center justify-center border border-gray-400">D</div>
                    )}
                </div>

                {/* Name & Balance Badge */}
                <div className="absolute -bottom-6 flex flex-col items-center w-32">
                    <div className="bg-slate-800/90 text-white text-[10px] px-3 py-0.5 rounded-t-sm border-x border-t border-slate-600 truncate max-w-full text-center">
                        {player.name}
                    </div>
                    <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-yellow-400 font-mono text-[10px] px-2 py-0.5 rounded-b-sm border border-slate-600 min-w-[60px] text-center shadow-inner">
                        ৳{player.balance}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerSeat;
