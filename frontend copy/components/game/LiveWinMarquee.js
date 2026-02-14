'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';

// Mock data integration or socket later. currently polling likely.
// For now we will assume a prop or internal static list for demo if API not ready,
// but let's implement basic structure.

export default function LiveWinMarquee() {
    const [wins, setWins] = useState([]);

    // Poll for wins (Simulation for MVP to avoid Sockets overhead right now)
    // In production, use Socket.IO
    useEffect(() => {
        // Mocking simulate live wins for "Social Proof" feel immediately
        const timer = setInterval(() => {
            const fakeUsers = ['User772', 'King001', 'LuckyBoy', 'MinesPro', 'BdGamer'];
            const randomWin = {
                id: Date.now(),
                user: fakeUsers[Math.floor(Math.random() * fakeUsers.length)],
                amount: (Math.random() * 5000 + 500).toFixed(0),
                game: 'Mines'
            };
            setWins(prev => [randomWin, ...prev.slice(0, 4)]);
        }, 5000); // New win every 5s

        return () => clearInterval(timer);
    }, []);

    if (wins.length === 0) return null;

    return (
        <div className="fixed bottom-20 left-4 z-40 pointer-events-none">
            <AnimatePresence>
                {wins.slice(0, 1).map((win) => (
                    <motion.div
                        key={win.id}
                        initial={{ opacity: 0, y: 20, x: -20 }}
                        animate={{ opacity: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-black/80 backdrop-blur border border-yellow-500/30 rounded-full px-4 py-2 flex items-center gap-3 shadow-[0_0_15px_rgba(234,179,8,0.3)] mb-2"
                    >
                        <div className="bg-yellow-500/20 p-1.5 rounded-full">
                            <Trophy className="w-3 h-3 text-yellow-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 font-bold leading-none">{win.user} just won</span>
                            <span className="text-sm font-black text-yellow-400 leading-none">৳{win.amount}</span>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
