'use client';
import Link from 'next/link';
import { Gamepad2, ArrowLeft } from 'lucide-react';

export default function GamingZone() {
    const games = [
        {
            title: "Super Ace Premium",
            desc: "The Flagship Experience",
            href: "/game/super-ace",
            icon: "👑",
            colors: "from-yellow-600 to-yellow-800",
            featured: true
        },
        {
            title: "Super Ace Classic",
            desc: "Original Retro Style",
            href: "/game/super-ace-classic",
            icon: "🎰",
            colors: "from-green-800 to-green-900 border-yellow-500/30",
            featured: false
        },
        {
            title: "Super Ace Reborn",
            desc: "Modern Fast-Paced UI",
            href: "/game/super-ace-reborn",
            icon: "⚡",
            colors: "from-blue-900 to-slate-900 border-blue-500/30",
            featured: false
        },
        {
            title: "Super Ace Pro",
            desc: "High Stakes & Dark Mode",
            href: "/game/super-ace-pro",
            icon: "💎",
            colors: "from-slate-900 to-black border-slate-700",
            featured: false
        }
    ];

    return (
        <div className="min-h-screen bg-[#0A2540] text-white p-6 pb-32">

            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2">
                    <Gamepad2 className="w-6 h-6 text-cyan-400" />
                    GAMING ZONE
                </h1>
            </div>

            {/* Game Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {games.map((game, idx) => (
                    <Link
                        key={idx}
                        href={game.href}
                        className={`
                            group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0F3057] shadow-xl
                            ${game.featured ? 'h-48' : 'h-32'}
                            hover:scale-[1.02] transition-transform duration-300
                        `}
                    >
                        {/* Dynamic Background */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${game.colors} opacity-80 group-hover:opacity-100 transition-opacity`}></div>

                        {/* Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

                        {/* Content */}
                        <div className="relative z-10 p-6 h-full flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="text-4xl filter drop-shadow-md">{game.icon}</div>
                                {game.featured && (
                                    <span className="bg-yellow-500/20 text-yellow-300 text-[10px] font-bold px-2 py-1 rounded border border-yellow-500/30 uppercase tracking-widest animate-pulse">
                                        Hot
                                    </span>
                                )}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold leading-none mb-1">{game.title}</h3>
                                <p className="text-xs text-white/70 font-medium">{game.desc}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

        </div>
    );
}
