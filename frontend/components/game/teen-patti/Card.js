"use client";
import React from 'react';
import { motion } from 'framer-motion';
import MarvelousCard from '../../ui/MarvelousCard';
import { BotanicalAce, BotanicalKing, BotanicalQueen } from '../../ui/BotanicalIcons';
import { Zap, Crown } from 'lucide-react';

const UserCard = ({ rank, suit, hidden, index, isWinner }) => {

    // Mapping for Botanical Icons
    let IconComponent = null;
    if (rank === 'A') IconComponent = BotanicalAce;
    if (rank === 'K') IconComponent = BotanicalKing;
    if (rank === 'Q') IconComponent = BotanicalQueen;
    if (rank === 'J') IconComponent = Zap;

    // Suit Colors for Dark Mode
    const getSuitColor = (s) => {
        if (s === 'H' || s === 'D') return 'text-rose-400'; // Softer Red
        return 'text-slate-200'; // Off-white for Black suits
    };

    const getSuitSymbol = (s) => {
        switch (s) {
            case 'H': return '♥';
            case 'D': return '♦';
            case 'C': return '♣';
            case 'S': return '♠';
            default: return '';
        }
    };

    if (hidden) {
        return (
            <motion.div
                initial={{ scale: 0, y: -50 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ delay: index * 0.1, type: "spring" }}
                className={`relative w-10 h-14 md:w-14 md:h-20 rounded-lg shadow-2xl flex items-center justify-center overflow-hidden transform hover:-translate-y-2 transition-transform duration-200 border border-[#d4af37]/50 bg-[#3d1c10]`}
                style={{
                    marginLeft: index > 0 ? '-20px' : '0',
                    zIndex: index
                }}
            >
                {/* Pattern Back */}
                <div className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: 'repeating-linear-gradient(45deg, #d4af37 0, #d4af37 1px, transparent 0, transparent 50%)',
                        backgroundSize: '10px 10px'
                    }}>
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-[#d4af37]/30 flex items-center justify-center">
                    <Crown className="w-4 h-4 text-[#d4af37]" />
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative"
            style={{
                marginLeft: index > 0 ? '-25px' : '0',
                zIndex: index + 10,
                transform: `rotate(${(index - 1) * 6}deg)`
            }}
        >
            <MarvelousCard
                className={`
                    w-12 h-16 md:w-16 md:h-24 !p-1 flex flex-col items-center justify-between
                    ${isWinner ? 'shadow-[0_0_20px_rgba(212,175,55,0.8)] border-yellow-400' : ''}
                `}
                glow={isWinner}
            >
                {/* Top Rank */}
                <div className={`text-[10px] md:text-sm font-black self-start leading-none ${getSuitColor(suit)}`}>
                    {rank}
                    <div className="text-[8px] opacity-75">{getSuitSymbol(suit)}</div>
                </div>

                {/* Center Icon */}
                <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${getSuitColor(suit)} opacity-90`}>
                    {IconComponent ? (
                        <IconComponent className="w-8 h-8 md:w-10 md:h-10 opacity-80" />
                    ) : (
                        <span className="text-2xl md:text-4xl font-serif">{getSuitSymbol(suit)}</span>
                    )}
                </div>

                {/* Bottom Rank */}
                <div className={`text-[10px] md:text-sm font-black self-end leading-none rotate-180 ${getSuitColor(suit)}`}>
                    {rank}
                    <div className="text-[8px] opacity-75">{getSuitSymbol(suit)}</div>
                </div>
            </MarvelousCard>
        </motion.div>
    );
};

export default UserCard;
