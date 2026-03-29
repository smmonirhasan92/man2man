'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles, X, ChevronRight, Coins, Lock, Timer } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const TIERS = [
    { id: 'free', name: 'Free Daily', cost: 0, color: 'emerald', icon: '🎁', desc: 'Once every 24h' },
    { id: 'bronze', name: 'Bronze Box', cost: 1, color: 'orange', icon: '📦', desc: 'Up to 5 NXS' },
    { id: 'silver', name: 'Silver Box', cost: 5, color: 'slate', icon: '💎', desc: 'Up to 25 NXS' },
    { id: 'gold', name: 'Gold Box', cost: 10, color: 'amber', icon: '👑', desc: 'Up to 100 NXS' }
];

export default function GiftBox({ user, onBalanceUpdate }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isOpening, setIsOpening] = useState(false);
    const [reward, setReward] = useState(null);
    const [selectedTier, setSelectedTier] = useState(null);

    const handleOpenBox = async (tier) => {
        try {
            setSelectedTier(tier);
            setIsOpening(true);
            
            const res = await api.post('/game/open-gift', { tier: tier.id });
            
            if (res.data.success) {
                // Simulate "wait" for animation
                setTimeout(() => {
                    setReward(res.data.reward);
                    setIsOpening(false);
                    onBalanceUpdate(res.data.newBalance);
                    toast.success(`You won ${res.data.reward.amountNXS} NXS!`, { icon: '🎉' });
                }, 2000);
            }
        } catch (err) {
            setIsOpening(false);
            setSelectedTier(null);
            toast.error(err.response?.data?.message || 'Failed to open box');
        }
    };

    const reset = () => {
        setReward(null);
        setSelectedTier(null);
        setIsOpening(false);
    };

    return (
        <>
            {/* Floating Entry Point */}
            <motion.button
                onClick={() => setIsOpen(true)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="fixed bottom-24 right-6 z-40 w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center shadow-[0_8px_25px_rgba(244,63,94,0.4)] border-2 border-white/20"
            >
                <div className="absolute inset-0 bg-white/20 rounded-full animate-ping opacity-20 pointer-events-none"></div>
                <Gift className="text-white w-7 h-7" />
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-rose-600 shadow-sm">
                    <Sparkles size={10} className="text-rose-700 animate-pulse" />
                </div>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            onClick={() => !isOpening && setIsOpen(false)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                        />
                        
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 20 }}
                            className="relative w-full max-w-sm bg-[#0f172a] rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl"
                        >
                            {/* Modal Header */}
                            <div className="p-6 pb-0 flex items-center justify-between">
                                <h3 className="text-lg font-black text-white uppercase tracking-widest">Mystery Vault</h3>
                                <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-6">
                                {!selectedTier ? (
                                    <div className="grid grid-cols-1 gap-3">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-1">Select your prize tier</p>
                                        {TIERS.map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => handleOpenBox(t)}
                                                className={`group relative flex items-center justify-between p-4 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300 overflow-hidden`}
                                            >
                                                <div className="flex items-center gap-4 relative z-10">
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-lg">
                                                        {t.icon}
                                                    </div>
                                                    <div className="text-left">
                                                        <h4 className="text-white font-black text-sm uppercase tracking-tight">{t.name}</h4>
                                                        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">{t.desc}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end relative z-10">
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${t.cost === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                                        {t.cost === 0 ? 'FREE' : `${t.cost} NXS`}
                                                    </span>
                                                    <ChevronRight size={16} className="text-slate-600 group-hover:translate-x-1 group-hover:text-white transition-all mt-1" />
                                                </div>
                                                <div className={`absolute inset-0 bg-gradient-to-r from-${t.color}-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8">
                                        <AnimatePresence mode="wait">
                                            {isOpening ? (
                                                <motion.div
                                                    key="opening"
                                                    initial={{ rotate: 0 }}
                                                    animate={{ rotate: [-5, 5, -5, 5, 0], scale: [1, 1.1, 1] }}
                                                    transition={{ repeat: Infinity, duration: 0.5 }}
                                                    className="flex flex-col items-center gap-6"
                                                >
                                                    <div className="w-32 h-32 bg-gradient-to-br from-pink-500 to-rose-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl border-4 border-white/20">
                                                        <Gift size={64} className="text-white animate-bounce" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-white font-black uppercase tracking-[0.3em] text-xs animate-pulse">Unlocking {selectedTier.name}...</p>
                                                        <p className="text-slate-500 text-[10px] uppercase font-bold mt-2">Checking probability matrices</p>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="reward"
                                                    initial={{ scale: 0.5, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    className="flex flex-col items-center gap-4 text-center"
                                                >
                                                    <div className="relative">
                                                        <motion.div 
                                                            animate={{ rotate: 360 }} 
                                                            transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                                                            className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full blur-2xl opacity-40"
                                                        />
                                                        <div className="relative w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center border-4 border-yellow-400/50 shadow-2xl">
                                                            <Coins size={48} className="text-yellow-400" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h2 className="text-2xl font-black text-white tracking-widest uppercase">YOU WON!</h2>
                                                        <div className="text-4xl font-black text-emerald-400 my-2">+{reward?.amountNXS} <span className="text-xs opacity-50">NXS</span></div>
                                                        <p className="text-slate-400 text-[10px] uppercase font-black bg-white/5 py-1 px-3 rounded-full mt-2 tracking-widest">{reward?.label}</p>
                                                    </div>
                                                    <button 
                                                        onClick={reset}
                                                        className="mt-6 w-full py-4 bg-emerald-600 text-white font-black uppercase tracking-widest text-[11px] rounded-2xl hover:bg-emerald-500 transition shadow-lg shadow-emerald-900/40"
                                                    >
                                                        Collect Reward
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>

                            {/* Footer hint */}
                            <div className="bg-white/5 p-4 flex items-center justify-center gap-6 border-t border-white/5">
                                <div className="flex items-center gap-1.5 opacity-30">
                                    <Shield size={12} className="text-emerald-400" />
                                    <span className="text-[8px] font-bold text-white uppercase tracking-widest">Secure RNG</span>
                                </div>
                                <div className="flex items-center gap-1.5 opacity-30">
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
