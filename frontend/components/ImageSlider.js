'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ImageSlider() {
    // Default Fallback Banners (Before Admin setup)
    const [banners, setBanners] = useState([
        {
            _id: '1',
            bgType: 'image',
            bgValue: '/slider_1.png',
            title: 'AFFILIATE POWER',
            subtitle: 'Teamwork Makes the Dream Work',
            btnText: 'Join Now',
            btnLink: '/register',
            btnColor: '#EF4444',
            textAnimation: 'fade-up'
        },
        {
            _id: '2',
            bgType: 'image',
            bgValue: '/slider_2.png',
            title: 'BIG BONUSES',
            subtitle: 'Work More, Earn More',
            btnText: 'Claim Reward',
            btnLink: '/tasks',
            btnColor: '#EAB308',
            textAnimation: 'zoom'
        },
        {
            _id: '3',
            bgType: 'image',
            bgValue: '/slider_3.png',
            title: 'USA OFFICIAL',
            subtitle: 'Secure & Fast Earnings',
            btnText: 'Learn More',
            btnLink: '/marketplace',
            btnColor: '#3B82F6',
            textAnimation: 'slide-left'
        }
    ]);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Fetch Banners from API
    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const res = await fetch('https://man2man-api.onrender.com/api/banners');
                if (res.ok) {
                    const data = await res.json();
                    if (data.length > 0) setBanners(data);
                }
            } catch (err) {
                console.error("Failed to load banners", err);
            }
        };
        // fetchBanners(); // Uncomment when API is live and populated
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [banners]);

    const currentBanner = banners[currentIndex];

    return (
        <div className="w-full mb-2">
            <div className="relative w-full aspect-[16/8] md:aspect-[21/9] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={currentBanner._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className="absolute inset-0 w-full h-full"
                    >
                        {/* 1. Background Layer */}
                        {currentBanner.bgType === 'color' ? (
                            <div className="w-full h-full" style={{ backgroundColor: currentBanner.bgValue }}></div>
                        ) : (
                            <img
                                src={currentBanner.bgValue}
                                alt={currentBanner.title}
                                className="w-full h-full object-cover"
                            />
                        )}

                        {/* 2. Dark Overlay for Text Readability */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>

                        {/* 3. Content Layer */}
                        <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 max-w-2xl">
                            {/* Title Animation */}
                            <motion.h2
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2, duration: 0.6 }}
                                className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter drop-shadow-lg"
                            >
                                {currentBanner.title}
                            </motion.h2>

                            {/* Subtitle Animation */}
                            {currentBanner.subtitle && (
                                <motion.p
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.4, duration: 0.6 }}
                                    className="text-xs md:text-sm font-bold text-slate-300 mt-1 tracking-wide"
                                >
                                    {currentBanner.subtitle}
                                </motion.p>
                            )}

                            {/* Button Animation */}
                            {currentBanner.btnText && (
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.6, duration: 0.4 }}
                                    className="mt-4"
                                >
                                    <a
                                        href={currentBanner.btnLink || '#'}
                                        className="inline-block px-4 py-2 rounded-lg text-xs font-bold text-white shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform"
                                        style={{ backgroundColor: currentBanner.btnColor }}
                                    >
                                        {currentBanner.btnText}
                                    </a>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Dots Overlay */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                    {banners.map((_, idx) => (
                        <div
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${idx === currentIndex ? 'bg-white w-5' : 'bg-white/40 w-1.5 hover:bg-white/60'}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
