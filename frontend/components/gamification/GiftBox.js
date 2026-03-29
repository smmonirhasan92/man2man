'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles, X, ChevronRight, Coins, Shield, Timer } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const TIERS = [
    { id: 'free', name: 'Free Daily', cost: 0, color: 'emerald', icon: '🎁', desc: 'Once every 24h' },
    { id: 'bronze', name: 'Bronze Box', cost: 1, color: 'orange', icon: '📦', desc: 'Up to 5 NXS' },
    { id: 'silver', name: 'Silver Box', cost: 5, color: 'slate', icon: '💎', desc: 'Up to 25 NXS' },
    { id: 'gold', name: 'Gold Box', cost: 10, color: 'amber', icon: '👑', desc: 'Up to 100 NXS' }
];

export default function GiftBox({ onBalanceUpdate }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isOpening, setIsOpening] = useState(false);
    const [reward, setReward] = useState(null);
    const [selectedTier, setSelectedTier] = useState(null);
    const [hasMounted, setHasMounted] = useState(false);

    // Hydration guard
    useEffect(() => {
        setHasMounted(true);

        const handleToggle = () => setIsOpen(prev => !prev);
        window.addEventListener('toggle-mystery-box', handleToggle);
        return () => window.removeEventListener('toggle-mystery-box', handleToggle);
    }, []);

    const handleOpenBox = async (tier) => {
        if (isOpening) return;
        try {
            setSelectedTier(tier);
            setIsOpening(true);
            
            const res = await api.post('/game/open-gift', { tier: tier.id });
            
            if (res.data.success) {
                // Ensure a smooth experience with a deliberate delay for animation
                setTimeout(() => {
                    setReward(res.data.reward);
                    setIsOpening(false);
                    if (typeof onBalanceUpdate === 'function') {
                        onBalanceUpdate(); // Re-fetch user data
                    }
                }, 2000);
            }
        } catch (err) {
            setIsOpening(false);
            setSelectedTier(null);
            toast.error(err.response?.data?.message || 'Failed to open box');
        }
    };

    const closeAll = () => {
        if (isOpening) return;
        setIsOpen(false);
        setReward(null);
        setSelectedTier(null);
    };

    if (!hasMounted) return null;

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 overflow-hidden">
                        {/* Backdrop - Safe Close Click */}
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            onClick={closeAll}
                            className="absolute inset-0 bg-black/90 backdrop-blur-md"
                        />
                        
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-[360px] bg-[#0f172a] rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden"
                        >
                            {/* Simple Close X */}
                            <button 
                                onClick={closeAll}
                                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white z-10"
                                disabled={isOpening}
                            >
                                <X size={18} />
                            </button>

                            {/* Reward OR Selection Screen */}
                            <div className="p-8">
                                {!selectedTier ? (
                                    <div className="space-y-4">
                                        <div className="mb-2">
                                            <h3 className="text-lg font-black text-white uppercase tracking-widest">Mystery Vault</h3>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Select your prize tier</p>
                                        </div>
                                        
                                        <div className="grid gap-3">
                                            {TIERS.map((t) => (
                                                <button
                                                    key={t.id}
                                                    onClick={() => handleOpenBox(t)}
                                                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-left"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-2xl">{t.icon}</span>
                                                        <div>
                                                            <div className="text-white font-bold text-sm uppercase">{t.name}</div>
                                                            <div className="text-slate-500 text-[9px] uppercase tracking-wider">{t.desc}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${t.cost === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                                            {t.cost === 0 ? 'FREE' : `${t.cost} NXS`}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-6 text-center">
                                        <AnimatePresence mode="wait">
                                            {isOpening ? (
                                                <motion.div
                                                    key="opening"
                                                    animate={{ rotate: [-2, 2, -2, 2, 0], scale: [1, 1.05, 1] }}
                                                    transition={{ repeat: Infinity, duration: 0.4 }}
                                                    className="flex flex-col items-center gap-6"
                                                >
                                                    <div className="w-28 h-28 bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl flex items-center justify-center shadow-xl border-4 border-white/10">
                                                        <Gift size={50} className="text-white animate-pulse" />
                                                    </div>
                                                    <div className="text-[10px] text-white font-black uppercase tracking-[0.4em] animate-pulse">Unlocking...</div>
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="reward"
                                                    initial={{ scale: 0.8, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    className="space-y-6"
                                                >
                                                    <div className="relative w-28 h-28 bg-slate-800 rounded-full mx-auto flex items-center justify-center border-4 border-yellow-500/50 shadow-lg">
                                                        <Coins size={44} className="text-yellow-400" />
                                                        <Sparkles className="absolute -top-2 -right-2 text-yellow-400 animate-pulse" />
                                                    </div>
                                                    
                                                    <div>
                                                        <div className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-1">{reward?.label || 'Victory!'}</div>
                                                        <div className="text-3xl font-black text-emerald-400">+{reward?.amountNXS || 0} <span className="text-xs opacity-50">NXS</span></div>
                                                    </div>

                                                    <button 
                                                        onClick={closeAll}
                                                        className="w-full py-4 bg-emerald-600 text-white font-black uppercase tracking-widest text-[11px] rounded-xl hover:bg-emerald-500 transition shadow-lg"
                                                    >
                                                        Collect & Close
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>

                            {/* Trust Footer */}
                            <div className="bg-white/5 p-4 flex items-center justify-center gap-6 border-t border-white/5 opacity-40">
                                <div className="flex items-center gap-1.5">
                                    <Shield size={12} className="text-emerald-400" />
                                    <span className="text-[8px] font-bold text-white uppercase tracking-widest">Secure RNG</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Timer size={12} className="text-blue-400" />
                                    <span className="text-[8px] font-bold text-white uppercase tracking-widest">Provably Fair</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
