'use client';
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { Coins, AlertCircle, ArrowLeft, Sparkles, Gift, Pointer } from 'lucide-react';
import useGameSound from '../../hooks/useGameSound';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const TIERS = {
  bronze: {
    name: 'Bronze Card', cost: 1, 
    btnClass: 'from-[#CD7F32] to-[#E8A55A]', textClass: 'text-[#8B4513]',
    bgPattern: 'bg-gradient-to-br from-[#CD7F32]/10 to-[#E8A55A]/20',
    cardCover: 'from-[#CD7F32] to-[#A0522D]'
  },
  silver: {
    name: 'Silver Card', cost: 2.5, 
    btnClass: 'from-[#909090] to-[#C0C0C0]', textClass: 'text-[#444]',
    bgPattern: 'bg-gradient-to-br from-[#909090]/10 to-[#C0C0C0]/20',
    cardCover: 'from-[#C0C0C0] to-[#808080]'
  },
  gold: {
    name: 'Gold Card', cost: 5, 
    btnClass: 'from-[#D4AF37] to-[#F3E5AB]', textClass: 'text-[#B8860B]',
    bgPattern: 'bg-gradient-to-br from-[#D4AF37]/10 to-[#F3E5AB]/20',
    cardCover: 'from-[#F3E5AB] to-[#D4AF37]'
  }
};

export default function ScratchCardClient({ onBalanceUpdate }) {
  const { user } = useAuth();
  const [tier, setTier] = useState('bronze');
  const [displayBalance, setDisplayBalance] = useState(null);
  
  // Game States: IDLE -> BOUGHT -> READY_TO_REVEAL -> REVEALED
  const [gameState, setGameState] = useState('IDLE');
  const [prizeData, setPrizeData] = useState(null);
  const { play: playSound } = useGameSound();

  // Sync initial balance
  useEffect(() => {
    if (user?.wallet?.main && gameState === 'IDLE') {
      setDisplayBalance(Number(user.wallet.main));
    }
  }, [user?.wallet?.main, gameState]);

  const buyCard = async () => {
    if (gameState !== 'IDLE' && gameState !== 'REVEALED') return;
    
    // [P#2] SERVER SPOILER GUARD (ACTIVATE PRE-FLIGHT)
    if (typeof window !== 'undefined') {
      window.isLuckTestAnimating = true;
      window.deferredLuckTestBalance = null;
    }

    // [P#3] VISUAL OPTIMISTIC DEDUCTION
    let baselineBalance = displayBalance;
    const currentCost = TIERS[tier].cost;
    
    if (baselineBalance !== null && baselineBalance >= currentCost) {
      const predicted = parseFloat((baselineBalance - currentCost).toFixed(2));
      setDisplayBalance(predicted);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('balance_update', { detail: predicted }));
      }
    } else {
        toast.error('Insufficient Balance');
        if (typeof window !== 'undefined') window.isLuckTestAnimating = false;
        return;
    }

    setGameState('BOUGHT');
    setPrizeData(null);

    try {
      const { data } = await api.post('/game/luck-test', { tier });
      setPrizeData(data.result);
      // Ready to be clicked by the user
      setTimeout(() => setGameState('READY_TO_REVEAL'), 400);
    } catch (err) {
      if (typeof window !== 'undefined') window.isLuckTestAnimating = false;
      if (baselineBalance !== null) {
        setDisplayBalance(baselineBalance);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('balance_update', { detail: baselineBalance }));
        }
      }
      setGameState('IDLE');
      toast.error(err.response?.data?.message || 'Transaction Failed');
    }
  };

  const handleRevealClick = () => {
      if (gameState !== 'READY_TO_REVEAL') return;
      
      playSound('click');
      setGameState('REVEALED');
      
      setTimeout(() => {
          playSound(prizeData?.amountNXS > 0 ? 'win' : 'lose');
          
          if (typeof window !== 'undefined') {
            window.isLuckTestAnimating = false;
            if (window.deferredLuckTestBalance) {
                const tmpDetails = window.deferredLuckTestBalance;
                window.deferredLuckTestBalance = null;
                window.dispatchEvent(new CustomEvent('balance_update', { detail: tmpDetails }));
            }
          }

          const trueBal = Number((parseFloat(displayBalance) + parseFloat(prizeData?.amountNXS || 0)).toFixed(2));
          setDisplayBalance(trueBal);
          if (onBalanceUpdate) onBalanceUpdate(trueBal);
      }, 400); // sound delay
  };

  return (
    <div className="w-full max-w-md mx-auto relative pt-4 pb-24 font-sans px-4">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
            <Link href="/dashboard" className="p-2 bg-slate-800 rounded-full cursor-pointer hover:bg-slate-700">
              <ArrowLeft size={20} className="text-slate-300" />
            </Link>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-2 px-4 shadow-lg text-right">
                <p className="text-[#94A3B8] text-[10px] font-bold uppercase tracking-widest font-mono">Main Assets</p>
                <div className="flex flex-col">
                  {displayBalance === null ? (
                      <span className="w-16 h-6 bg-slate-700 animate-pulse rounded mt-1 inline-block" />
                  ) : (
                      <span className={`text-[20px] font-black text-white font-mono leading-none tracking-tight`}>
                          {parseFloat(displayBalance).toFixed(2)}
                      </span>
                  )}
                </div>
            </div>
        </div>

        {/* Info Header */}
        <div className="text-center mb-6">
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight flex items-center justify-center gap-2">
                <Sparkles className="text-amber-400" /> One-Click Reward
            </h1>
            <p className="text-slate-400 text-sm">Choose a tier, then tap the card to instantly discover your prize!</p>
        </div>

        {/* Tier Selector */}
        <div className="flex gap-3 justify-center mb-6">
          {Object.entries(TIERS).map(([t, info]) => (
            <button
              key={t}
              onClick={() => {
                  if (gameState === 'IDLE' || gameState === 'REVEALED') setTier(t);
              }}
              disabled={gameState === 'BOUGHT' || gameState === 'READY_TO_REVEAL'}
              className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all duration-300 ${
                tier === t 
                  ? `bg-gradient-to-br ${info.btnClass} ${info.textClass} shadow-lg shadow-[#1E293B]/50 scale-105 border-2 border-white/20`
                  : 'bg-[#1E293B] text-slate-400 border-2 border-[#334155] hover:bg-slate-800'
              } ${gameState === 'BOUGHT' || gameState === 'READY_TO_REVEAL' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="text-sm font-black mb-1 font-mono tracking-widest">{info.name.split(' ')[0]}</span>
              <span className={`text-[10px] font-bold opacity-80 font-mono tracking-wider ${tier===t ? 'text-white/80' : ''}`}>{info.cost} NXS</span>
            </button>
          ))}
        </div>

        {/* The Click-Reveal Card Container */}
        <div className="relative w-full aspect-[3/4] rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.6)] border-[4px] border-[#1E293B] bg-[#0A0F1A]">
            
            {/* The Revealed Prize Underneath */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-0">
                {prizeData ? (
                    <motion.div 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={gameState === 'REVEALED' ? { scale: 1, opacity: 1 } : { scale: 0.5, opacity: 0 }}
                        transition={{ type: 'spring', bounce: 0.5 }}
                        className="flex flex-col items-center justify-center w-full"
                    >
                        {prizeData.amountNXS > 0 ? (
                           <div className="bg-amber-400/20 w-24 h-24 rounded-full flex items-center justify-center mb-4 animate-bounce shadow-[0_0_30px_rgba(251,191,36,0.5)]">
                               <Coins size={50} className="text-amber-400 drop-shadow-lg" />
                           </div>
                        ) : (
                           <div className="bg-slate-700/50 w-24 h-24 rounded-full flex items-center justify-center mb-4 relative z-10">
                               <AlertCircle size={50} className="text-slate-400" />
                           </div>
                        )}
                        <span className="text-3xl font-black text-white font-sans drop-shadow-lg uppercase tracking-tight relative z-10">{prizeData.label}</span>
                        <span className={`text-2xl font-black mt-2 font-mono relative z-10 ${prizeData.amountNXS > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                            {prizeData.amountNXS > 0 ? `+${prizeData.amountNXS} NXS` : '0 NXS'}
                        </span>
                    </motion.div>
                ) : (
                    <div className="text-slate-600 font-mono animate-pulse">Awaiting Unlock...</div>
                )}
                
                {/* Background Pattern for the revealed back part */}
                <div className={`absolute inset-0 ${TIERS[tier].bgPattern} opacity-50 z-0`} />
            </div>

            {/* The Animated Cover Mask */}
            <AnimatePresence>
                {gameState !== 'REVEALED' && (
                    <motion.div 
                        exit={{ y: "-100%", opacity: 0, scale: 1.1 }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                        className={`absolute inset-0 z-10 bg-gradient-to-br ${TIERS[tier].cardCover} shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center p-6 ${gameState === 'READY_TO_REVEAL' ? 'cursor-pointer' : ''}`}
                        onClick={handleRevealClick}
                    >
                        {/* Interactive Design on the Cover */}
                        <div className="w-full h-full border-2 border-dashed border-white/30 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group">
                             {/* Glossy Overlay */}
                             <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>

                             <Gift size={64} className="text-white/80 drop-shadow-lg mb-6 animate-pulse" />
                             
                             {gameState === 'READY_TO_REVEAL' ? (
                                 <motion.button 
                                     animate={{ scale: [1, 1.1, 1] }} 
                                     transition={{ repeat: Infinity, duration: 1.5 }}
                                     className="bg-white text-slate-900 px-6 py-3 rounded-full font-black text-lg uppercase tracking-widest shadow-2xl flex items-center gap-2"
                                 >
                                     <Pointer size={20} /> Tap To Open
                                 </motion.button>
                             ) : gameState === 'BOUGHT' ? (
                                 <div className="text-white/80 font-bold font-mono animate-pulse">Preparing Reward...</div>
                             ) : (
                                 <div className="text-center">
                                     <h3 className="text-2xl font-black text-white uppercase tracking-tight drop-shadow-md mb-2">Mystery Reward</h3>
                                     <p className="text-white/80 text-sm font-medium px-4">Buy the card below to unlock this locked prize box.</p>
                                 </div>
                             )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Idle Overlay Button to Buy */}
            {(gameState === 'IDLE' || gameState === 'REVEALED') && (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-8 bg-gradient-to-t from-[#0B0F1A] via-[#0B0F1A]/80 to-transparent backdrop-blur-[1px]"
                >
                    <button 
                        onClick={buyCard}
                        className={`px-8 py-4 w-3/4 rounded-full font-black text-xl tracking-tight shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/20 hover:scale-105 active:scale-95 transition-all bg-gradient-to-r ${TIERS[tier].btnClass} ${TIERS[tier].textClass}`}
                    >
                        {gameState === 'REVEALED' ? 'Play Again' : `Buy For ${TIERS[tier].cost} NXS`}
                    </button>
                    {gameState === 'REVEALED' && (
                        <p className="mt-4 text-slate-300 text-sm font-medium bg-black/50 px-4 py-2 rounded-xl border border-slate-700">Prize unlocked successfully!</p>
                    )}
                </motion.div>
            )}
        </div>
        
    </div>
  );
}
