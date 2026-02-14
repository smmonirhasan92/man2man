'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Globe, Zap, Trophy, Shield } from 'lucide-react';
import Link from 'next/link';

const SLIDES = [
    {
        id: 1,
        title: "HIGH-YIELD USA NODES",
        subtitle: "Earn $5.00/day per Active Server",
        bg: "from-blue-900 to-[#0a192f]",
        icon: Globe,
        flag: "https://flagcdn.com/w80/us.png",
        stats: "70% PROFIT SHARE",
        link: "/marketplace"
    },
    {
        id: 2,
        title: "LOTTERY JACKPOT",
        subtitle: "Next Draw in 2h 15m. Win Big!",
        bg: "from-purple-900 to-[#1e0b2b]",
        icon: Trophy,
        stats: "$5,000 PRIZE POOL",
        link: "/lottery"
    },
    {
        id: 3,
        title: "P2P FINANCE LIVE",
        subtitle: "Instant USDT/BDT Withdrawals",
        bg: "from-emerald-900 to-[#062c19]",
        icon: Zap,
        stats: "0% FEE TODAY",
        link: "/p2p"
    }
];

export default function BannerSlider() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex(prev => (prev + 1) % SLIDES.length);
        }, 5000); // 5s auto-slide
        return () => clearInterval(timer);
    }, []);

    const slide = SLIDES[index];

    return (
        <div className="relative w-full overflow-hidden rounded-2xl shadow-xl aspect-[16/7] min-h-[160px]">
            <AnimatePresence mode='wait'>
                <motion.div
                    key={slide.id}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.5 }}
                    className={`absolute inset-0 bg-gradient-to-br ${slide.bg} flex flex-col justify-center p-6`}
                >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-20 bg-[url('/grid.svg')] mix-blend-overlay"></div>

                    <div className="relative z-10 flex items-start justify-between">
                        <div className="max-w-[70%]">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-0.5 bg-white/10 rounded text-[10px] font-bold text-white/80 border border-white/10 uppercase tracking-widest backdrop-blur-sm">
                                    {slide.stats}
                                </span>
                            </div>
                            <h2 className="text-xl md:text-2xl font-black text-white leading-none mb-2 italic">
                                {slide.title}
                            </h2>
                            <p className="text-xs md:text-sm text-white/70 font-medium">
                                {slide.subtitle}
                            </p>
                        </div>

                        {/* Icon/Image */}
                        <div className="relative">
                            {slide.flag ? (
                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 shadow-lg">
                                    <img src={slide.flag} className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                                    <slide.icon className="w-6 h-6 text-white" />
                                </div>
                            )}
                        </div>
                    </div>

                    <Link href={slide.link} className="absolute bottom-4 right-4 flex items-center gap-1 text-xs font-bold text-white bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-all">
                        EXPLORE <ChevronRight size={14} />
                    </Link>

                </motion.div>
            </AnimatePresence>

            {/* Dots */}
            <div className="absolute bottom-3 left-6 flex gap-1.5 z-20">
                {SLIDES.map((_, i) => (
                    <div
                        key={i}
                        className={`h-1 rounded-full transition-all duration-300 ${i === index ? 'w-6 bg-white' : 'w-2 bg-white/30'}`}
                    />
                ))}
            </div>
        </div>
    );
}
