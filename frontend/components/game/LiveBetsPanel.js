'use client';
import { useState, useEffect } from 'react';
import { User } from 'lucide-react';

const randomNames = ['User123', 'ProPlayer', 'Winner99', 'CryptoKing', 'LuckyMe', 'AviatorGod', 'Speedy', 'MoonBoy'];

export default function LiveBetsPanel() {
    const [bets, setBets] = useState([]);

    useEffect(() => {
        // Initial population
        setBets(Array.from({ length: 8 }).map(() => generateRandomBet()));

        // Update loop
        const interval = setInterval(() => {
            setBets(prev => {
                const newBet = generateRandomBet();
                // Keep list size constant, unshift new, pop old
                return [newBet, ...prev.slice(0, 7)];
            });
        }, 1500); // New bet every 1.5s

        return () => clearInterval(interval);
    }, []);

    const generateRandomBet = () => {
        const name = randomNames[Math.floor(Math.random() * randomNames.length)];
        const amount = (Math.random() * 50 + 10).toFixed(0); // 10 - 60
        const multiplier = (Math.random() * 2 + 1).toFixed(2); // 1.00 - 3.00
        const isWin = Math.random() > 0.4;
        return {
            id: Math.random(),
            name,
            amount,
            multiplier: isWin ? multiplier : null,
            win: isWin
        };
    };

    return (
        <div className="w-full md:w-64 bg-slate-900/50 backdrop-blur-md border-l border-white/10 p-4 hidden md:block h-screen overflow-hidden">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Live Bets
            </h3>
            <div className="space-y-2">
                {bets.map(bet => (
                    <div key={bet.id} className={`flex justify-between items-center text-xs p-2 rounded-lg ${bet.win ? 'bg-green-500/20 border border-green-500/30' : 'bg-slate-800/50'}`}>
                        <div className="flex items-center gap-2 text-slate-300">
                            <User size={12} />
                            {bet.name}
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="font-mono text-slate-200">৳{bet.amount}</span>
                            {bet.win && <span className="text-green-400 font-bold">{bet.multiplier}x</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
