'use client';
import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Zap } from 'lucide-react';

const FAKE_WINS = [
    { user: 'S***akib', amount: '৳5,200', game: 'Mines', type: 'big' },
    { user: 'R***him', amount: '৳1,500', game: 'Ludo', type: 'normal' },
    { user: 'K***arin', amount: '৳12,000', game: 'Super Ace', type: 'mega' },
    { user: 'T***anvir', amount: '৳800', game: 'Aviator', type: 'normal' },
    { user: 'Admin', amount: '৳25,000', game: 'Jackpot', type: 'jackpot' },
];

export default function LiveTicker() {
    const [currentWin, setCurrentWin] = useState(FAKE_WINS[0]);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setIsVisible(false);
            setTimeout(() => {
                const randomWin = FAKE_WINS[Math.floor(Math.random() * FAKE_WINS.length)];
                setCurrentWin(randomWin);
                setIsVisible(true);
            }, 500);
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    const getColors = (type) => {
        if (type === 'mega' || type === 'jackpot') return 'from-yellow-500 to-amber-600 border-yellow-400';
        if (type === 'big') return 'from-emerald-500 to-green-600 border-emerald-400';
        return 'from-slate-700 to-slate-800 border-slate-600';
    };

    return (
        <div className="fixed top-20 right-4 z-40 pointer-events-none md:right-8">
            <div
                className={`
                    flex items-center gap-3 px-4 py-2 rounded-full border shadow-xl backdrop-blur-md transform transition-all duration-500
                    bg-gradient-to-r ${getColors(currentWin.type)}
                    ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}
                `}
            >
                <div className="bg-white/20 p-1.5 rounded-full">
                    {currentWin.type === 'jackpot' ? <Trophy size={16} className="text-white" /> : <Zap size={16} className="text-white" />}
                </div>
                <div>
                    <p className="text-[10px] text-white/80 font-bold uppercase leading-none">{currentWin.user} just won</p>
                    <p className="text-xs text-white font-black leading-none mt-0.5">{currentWin.amount} in {currentWin.game}</p>
                </div>
            </div>
        </div>
    );
}
