'use client';
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { Coins, AlertCircle, ArrowLeft, Sparkles, Gift, Pointer } from 'lucide-react';
import useGameSound from '../../hooks/useGameSound';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import ScratchCanvas from './ScratchCanvas';

const TIERS = {
  bronze: {
    name: 'Bronze Fortune', cost: 5, 
    btnClass: 'from-[#CD7F32] to-[#E8A55A]', textClass: 'text-[#8B4513]',
    bgPattern: 'bg-gradient-to-br from-[#CD7F32]/20 to-[#E8A55A]/30',
    cardCover: '#C0C0C0', 
    accent: '#CD7F32',
    slogan: 'Unlock Your Fortune'
  },
  silver: {
    name: 'Silver Luck', cost: 10, 
    btnClass: 'from-[#94A3B8] to-[#CBD5E1]', textClass: 'text-[#334155]',
    bgPattern: 'bg-gradient-to-br from-[#94A3B8]/20 to-[#CBD5E1]/30',
    cardCover: '#D1D5DB', 
    accent: '#94A3B8',
    slogan: 'Claim Your Destiny'
  },
  gold: {
    name: 'Golden Treasure', cost: 15, 
    btnClass: 'from-[#D4AF37] to-[#F3E5AB]', textClass: 'text-[#B8860B]',
    bgPattern: 'bg-gradient-to-br from-[#FFD700]/10 to-[#F3E5AB]/20',
    cardCover: '#FFD700', 
    accent: '#FFD700',
    slogan: 'Wealth Awaits You'
  }
};

export default function ScratchCardClient({ onBalanceUpdate }) {
  const router = useRouter();
  const { user } = useAuth();
  const [tier, setTier] = useState('bronze');
  const [displayBalance, setDisplayBalance] = useState(null);
  const [isExiting, setIsExiting] = useState(false);
  
  const [gameState, setGameState] = useState('IDLE');
  const [prizeData, setPrizeData] = useState(null);
  const { play: playSound } = useGameSound();

  const handleExit = () => {
    if (gameState === 'BOUGHT' || gameState === 'READY_TO_SCRATCH') return;
    setIsExiting(true);
    playSound('click');
    setTimeout(() => {
      router.push('/dashboard');
    }, 300);
  };

  useEffect(() => {
    if (user?.wallet?.main && gameState === 'IDLE') {
      setDisplayBalance(Number(user.wallet.main));
    }
  }, [user?.wallet?.main, gameState]);

  const baselineBalanceRef = React.useRef(null);
  useEffect(() => {
    if (displayBalance !== null && gameState === 'IDLE') {
        baselineBalanceRef.current = displayBalance;
    }
  }, [displayBalance, gameState]);

  const buyCard = async () => {
    if (gameState !== 'IDLE' && gameState !== 'REVEALED') return;
    
    if (typeof window !== 'undefined') {
      window.isLuckTestAnimating = true;
      window.deferredLuckTestBalance = null;
    }

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
      const { data } = await api.post('/game/scratch-card', { tier });
      setPrizeData(data.result);
      setTimeout(() => setGameState('READY_TO_SCRATCH'), 400);
    } catch (err) {
      if (typeof window !== 'undefined') window.isLuckTestAnimating = false;
      if (baselineBalanceRef.current !== null) {
        setDisplayBalance(baselineBalanceRef.current);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('balance_update', { detail: baselineBalanceRef.current }));
        }
      }
      setGameState('IDLE');
      toast.error(err.response?.data?.message || 'Transaction Failed');
    }
  };

  const onScratchComplete = async () => {
      if (gameState !== 'READY_TO_SCRATCH') return;
      
      setGameState('REVEALED');
      
      // 🚀 PARTICLES & FIREWORKS
      if (prizeData?.amountNXS > 0) {
        const confetti = (await import('canvas-confetti')).default;
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: [TIERS[tier].accent, '#FFFFFF', '#FFD700']
        });
        playSound('win');
      } else {
        playSound('loss');
      }
      
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
  };

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md mx-auto relative pt-4 pb-32 font-sans px-4 min-h-[100dvh]"
        >
            {/* Main Frame Container as requested by user */}
            <div className="w-full bg-[#0F172A]/80 border border-slate-700/50 rounded-[2rem] p-4 sm:p-5 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-md relative overflow-visible">
                
                {/* Ambient Background Glow for the frame */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 opacity-20 bg-gradient-to-b ${TIERS[tier].btnClass} blur-[50px] pointer-events-none rounded-[2rem]`}></div>
    
                {/* Header Section */}
                <div className="flex items-center justify-between mb-4 relative z-10">
                    <button 
                      onClick={handleExit}
                      className="p-2 bg-slate-800 rounded-full cursor-pointer hover:bg-slate-700 shadow-md transition-all active:scale-90"
                    >
                      <ArrowLeft size={18} className="text-slate-300" />
                    </button>
                    <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-2 px-4 shadow-lg text-right flex items-center gap-3">
                        <p className="text-[#94A3B8] text-[9px] font-bold uppercase tracking-widest font-mono text-left leading-tight">Main<br/>Assets</p>
                        <div className="flex flex-col">
                          {displayBalance === null ? (
                              <span className="w-16 h-5 bg-slate-700 animate-pulse rounded my-0.5 inline-block" />
                          ) : (
                              <span className={`text-xl font-black text-white font-mono leading-none tracking-tight`}>
                                  {parseFloat(displayBalance).toFixed(2)}
                              </span>
                          )}
                        </div>
                    </div>
                </div>

            {/* Info Header */}
            <div className="text-center mb-4 relative z-10 shrink-0">
                <h1 className="text-3xl font-black text-white mb-1 tracking-tighter flex items-center justify-center gap-3 drop-shadow-xl">
                    <Sparkles className="text-amber-400 w-6 h-6 animate-pulse" /> {TIERS[tier].name}
                </h1>
                <p className="text-amber-500/60 text-[10px] uppercase tracking-[0.4em] font-black mb-1">{TIERS[tier].slogan}</p>
                <p className="text-slate-500 text-[10px] px-6 uppercase tracking-widest font-bold opacity-40 italic">Global Luck Multiplier: 1:8 Pool Active</p>
            </div>

            {/* Tier Selector */}
            <div className="flex gap-2 justify-center mb-6 shrink-0 relative z-10">
              {Object.entries(TIERS).map(([t, info]) => (
                <button
                  key={t}
                  onClick={() => {
                      if (gameState === 'IDLE' || gameState === 'REVEALED') setTier(t);
                  }}
                  disabled={gameState === 'BOUGHT' || gameState === 'READY_TO_SCRATCH'}
                  className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl transition-all duration-300 ${
                    tier === t 
                      ? `bg-gradient-to-br ${info.btnClass} ${info.textClass} shadow-lg shadow-[#1E293B]/50 scale-105 border-2 border-white/20`
                      : 'bg-[#1E293B] text-slate-400 border border-[#334155] hover:bg-slate-800'
                  } ${gameState === 'BOUGHT' || gameState === 'READY_TO_SCRATCH' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="text-sm font-black mb-0.5 font-mono tracking-widest">{info.name.split(' ')[0]}</span>
                  <span className={`text-[9px] font-bold opacity-80 font-mono tracking-wider ${tier===t ? 'text-white/80' : ''}`}>{info.cost} NXS</span>
                </button>
              ))}
            </div>

            {/* The Scratch Card Container */}
            <div className="relative w-full z-10 flex items-center justify-center mb-5 mt-2">
                <div className="w-full max-w-[300px] aspect-square relative rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.6)] border-[5px] border-[#1E293B] bg-[#0A0F1A] overflow-hidden group">
                    
                    {/* The Prize Content (Bottom Layer) */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900">
                        <AnimatePresence>
                            {prizeData && (
                                <motion.div 
                                    initial={{ scale: 0.3, opacity: 0, rotate: -10 }}
                                    animate={{ scale: 1.1, opacity: 1, rotate: 0 }}
                                    exit={{ scale: 0.5, opacity: 0 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 12 }}
                                    className="flex flex-col items-center justify-center w-full z-10"
                                >
                                    {prizeData.amountNXS > 0 ? (
                                       <div className="relative mb-4">
                                           <motion.div 
                                                animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="absolute inset-0 blur-3xl opacity-60 bg-amber-400" 
                                           />
                                           <div className="relative bg-gradient-to-br from-amber-300 to-amber-600 w-28 h-28 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(251,191,36,0.5)] border-4 border-white/20">
                                               <Coins className="text-white drop-shadow-lg w-14 h-14" />
                                           </div>
                                       </div>
                                    ) : (
                                       <div className="bg-slate-700/50 w-24 h-24 rounded-full flex items-center justify-center mb-4 border-2 border-slate-600/50">
                                           <AlertCircle className="text-slate-400 w-12 h-12" />
                                       </div>
                                    )}
                                    <motion.span 
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 0.8, repeat: Infinity }}
                                        className="text-4xl font-black text-white font-sans drop-shadow-2xl uppercase tracking-tighter"
                                    >
                                        {prizeData.label}
                                    </motion.span>
                                    <span className={`text-2xl font-black mt-2 font-mono ${prizeData.amountNXS > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                                        {prizeData.amountNXS > 0 ? `+${prizeData.amountNXS} NXS` : '0 NXS'}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        
                        {!prizeData && (
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                                <div className="text-slate-500 font-bold font-mono text-xs uppercase tracking-widest">Generating Luck...</div>
                            </div>
                        )}
                        
                        <div className={`absolute inset-0 ${TIERS[tier].bgPattern} opacity-40 z-0`} />
                    </div>

                    {/* The Scratch Overlay (Top Layer) */}
                    {(gameState === 'READY_TO_SCRATCH' || gameState === 'BOUGHT') && (
                        <div className="absolute inset-0 z-20">
                            <ScratchCanvas 
                                width={300}
                                height={300}
                                overlayColor={TIERS[tier].cardCover}
                                accentColor={TIERS[tier].accent}
                                isReady={gameState === 'READY_TO_SCRATCH'}
                                onComplete={onScratchComplete}
                                onScratch={() => {
                                    playSound('tick');
                                    // Hide guide when scratching starts
                                    const guide = document.getElementById('scratch-guide');
                                    if (guide) guide.style.opacity = '0';
                                }}
                            />
                            
                            {/* Visual Scratch Guide */}
                            {gameState === 'READY_TO_SCRATCH' && (
                                <motion.div 
                                    id="scratch-guide"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30 transition-opacity duration-300"
                                >
                                    <motion.div 
                                        animate={{ 
                                            y: [0, -15, 0],
                                            scale: [1, 1.1, 1]
                                        }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                        className="bg-white/20 backdrop-blur-md p-4 rounded-full border border-white/30 shadow-2xl"
                                    >
                                        <Pointer size={40} className="text-white drop-shadow-lg rotate-12" />
                                    </motion.div>
                                    <span className="mt-4 text-white font-black text-xs uppercase tracking-[0.3em] drop-shadow-md bg-black/20 px-3 py-1 rounded-full border border-white/10">
                                        Swipe Here
                                    </span>
                                </motion.div>
                            )}
                        </div>
                    )}

                    {/* Intro Overlay if Idle */}
                    {gameState === 'IDLE' && (
                        <div className="absolute inset-0 z-20 bg-[#0F172A]/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center border-2 border-white/5 mx-1 my-1 rounded-[2.5rem]">
                             <motion.div 
                                animate={{ 
                                    scale: [1, 1.05, 1],
                                    rotate: [0, 2, -2, 0]
                                }}
                                transition={{ repeat: Infinity, duration: 4 }}
                                className="w-24 h-24 bg-gradient-to-br from-slate-800 to-slate-950 rounded-3xl flex items-center justify-center mb-6 shadow-2xl border border-white/10 relative"
                             >
                                <div className={`absolute inset-0 bg-gradient-to-br ${TIERS[tier].btnClass} opacity-20 blur-xl`} />
                                <Gift size={48} className="text-white relative z-10" />
                             </motion.div>
                             
                             <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">{TIERS[tier].name}</h3>
                             <div className="h-1 w-12 bg-amber-500/50 rounded-full mb-4" />
                             <p className="text-amber-400 text-xs font-black uppercase tracking-[0.3em] mb-2">{TIERS[tier].slogan}</p>
                             <p className="text-slate-400 text-[10px] leading-tight px-6 uppercase tracking-widest font-bold opacity-60">Instant Reward reveal mechanics</p>
                        </div>
                    )}
                </div>
                
                {/* Floating Buy Button */}
                {(gameState === 'IDLE' || gameState === 'REVEALED') && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -bottom-6 w-full flex justify-center z-30 pointer-events-none"
                    >
                        <button 
                            onClick={buyCard}
                            className={`pointer-events-auto px-10 py-4 w-[85%] rounded-[1.5rem] font-black text-xl tracking-tighter shadow-[0_20px_40px_rgba(0,0,0,0.7)] border-2 border-white/20 hover:-translate-y-1 active:translate-y-1 transition-all bg-gradient-to-r ${TIERS[tier].btnClass} ${TIERS[tier].textClass} uppercase`}
                        >
                            {gameState === 'REVEALED' ? 'Play Again' : `Get Card • ${TIERS[tier].cost} NXS`}
                        </button>
                    </motion.div>
                )}
            </div>
            
        </div>
      </motion.div>
    )}
  </AnimatePresence>
  );
}
