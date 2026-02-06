'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Gamepad2, Rocket, Plus, Wallet, Play, Diamond, Zap } from 'lucide-react';
import { authService } from '../../services/authService'; // Adjust path if needed (../../services/authService)
import GameWalletSheet from '../../components/GameWalletSheet';
import { motion } from 'framer-motion';

export default function GameCenter() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isWalletOpen, setIsWalletOpen] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const data = await authService.getCurrentUser();
                setUser(data);
            } catch (err) {
                console.error("Failed to fetch user", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    // 15 Games Data (2 Real, 13 Mock)
    const games = [
        // Aviator Removed
        {
            id: 'super-ace',
            name: 'Super Ace',
            desc: 'Golden Slot Royale',
            icon: <Zap className="w-8 h-8 text-yellow-400" />,
            link: '/game/super-ace',
            real: true,
            color: 'from-amber-400/20 to-orange-500/20',
            accent: 'text-amber-400'
        },
        {
            id: 'lottery',
            name: 'Lottery',
            desc: 'Win Big Prizes',
            icon: <Diamond className="w-8 h-8 text-cyan-400" />,
            link: '/lottery',
            real: true,
            color: 'from-cyan-500/20 to-blue-500/20',
            accent: 'text-cyan-400'
        }
    ];

    return (
        <div className="text-white pb-24 font-sans selection:bg-cyan-500/30">

            {/* 1. Sticky Glass Header */}
            <header className="sticky top-0 z-50 w-full glass border-b border-white/5 shadow-lg shadow-black/20">
                <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between" onClick={() => setIsWalletOpen(true)}>

                    <div className="flex items-center gap-3 cursor-pointer group">
                        <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                            <Wallet className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Main Balance</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-cyan-400 font-medium">৳</span>
                                <h2 className="text-lg font-black text-white leading-none">
                                    {loading ? '...' : Number(user?.wallet_balance || 0).toFixed(2)}
                                </h2>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 cursor-pointer group">
                        <div className="text-right">
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Game Wallet</p>
                            <div className="flex items-baseline gap-1 justify-end">
                                <span className="text-purple-400 font-medium">৳</span>
                                <h2 className="text-lg font-black text-white leading-none">
                                    {loading ? '...' : Number(user?.game_balance || 0).toFixed(2)}
                                </h2>
                            </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                            <Plus className="w-4 h-4 text-purple-400" />
                        </div>
                    </div>

                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-md mx-auto px-4 pt-6">

                <div className="mb-6">
                    <h1 className="text-2xl font-black text-white mb-1">Game Center</h1>
                    <p className="text-slate-400 text-sm">Choose your winning game</p>
                </div>

                {/* 2. Game Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {games.map((game, idx) => (
                        <Link
                            key={game.id}
                            href={game.link}
                            className={`
                                relative group overflow-hidden rounded-3xl p-4
                                border border-white/10
                                backdrop-blur-md bg-white/5
                                hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]
                                transition-all duration-300
                                ${!game.real ? 'opacity-70 grayscale-[0.5] hover:opacity-100 hover:grayscale-0' : ''}
                            `}
                        >
                            {/* Hover Scale Wrapper using custom div because Link doesn't always handle transform perfectly with sticky header contexts sometimes, but here it's fine. 
                                We'll use a direct transform on hover
                            */}
                            <div className="transform group-hover:scale-105 transition-transform duration-300 h-full flex flex-col justify-between min-h-[160px]">

                                {/* Background Gradient Blob */}
                                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${game.color} blur-[40px] rounded-full opacity-60 group-hover:opacity-100 transition-opacity`}></div>

                                <div className="relative z-10">
                                    <div className={`
                                        w-12 h-12 rounded-2xl mb-3 flex items-center justify-center
                                        bg-[#0f172a]/50 border border-white/5 shadow-inner
                                        group-hover:shadow-cyan-500/20
                                        transition-shadow
                                    `}>
                                        {game.icon}
                                    </div>
                                    <h3 className="text-lg font-bold text-white leading-tight mb-1">{game.name}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{game.desc}</p>
                                </div>

                                <div className="relative z-10 mt-4 flex justify-between items-end">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                                        <span className={`text-[10px] font-bold ${game.accent}`}>Play Now</span>
                                    </div>
                                    <div className={`
                                        w-8 h-8 rounded-full flex items-center justify-center
                                        bg-white/5 border border-white/10
                                        group-hover:bg-cyan-500 group-hover:border-cyan-400
                                        transition-colors
                                    `}>
                                        <Play className="w-3.5 h-3.5 text-white fill-current" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

            </main>

            {/* Wallet Sheet Modal */}
            <GameWalletSheet
                isOpen={isWalletOpen}
                onClose={() => setIsWalletOpen(false)}
                mainBalance={user?.wallet_balance}
                gameBalance={user?.game_balance} // Assuming this field exists on user object
                onSuccess={() => {
                    // Refetch user to update balances
                    authService.getCurrentUser().then(setUser);
                }}
            />

        </div>
    );
}
