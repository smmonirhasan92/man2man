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
import FlyingNumber from '../ui/FlyingNumber';

const TIERS = {
  bronze: {
    name: 'Bronze Fortune', cost: 5, 
    btnClass: 'from-[#CD7F32] to-[#A0522D]', textClass: 'text-white',
    bgPattern: 'bg-gradient-to-br from-[#CD7F32]/10 to-[#8B4513]/20',
    cardCover: '#B87333', 
    accent: '#CD7F32',
    slogan: 'Unlock Your Fortune',
    border: 'border-[#CD7F32]/40',
    glow: 'shadow-[#CD7F32]/20'
  },
  silver: {
    name: 'Silver Luck', cost: 10, 
    btnClass: 'from-[#94A3B8] to-[#64748B]', textClass: 'text-white',
    bgPattern: 'bg-gradient-to-br from-[#94A3B8]/10 to-[#475569]/20',
    cardCover: '#A0A0A0', 
    accent: '#94A3B8',
    slogan: 'Claim Your Destiny',
    border: 'border-[#94A3B8]/40',
    glow: 'shadow-[#94A3B8]/20'
  },
  gold: {
    name: 'Golden Treasure', cost: 25, 
    btnClass: 'from-[#D4AF37] to-[#B8860B]', textClass: 'text-[#5C4033]',
    bgPattern: 'bg-gradient-to-br from-[#FFD700]/10 to-[#DAA520]/20',
    cardCover: '#FFD700', 
    accent: '#FFD700',
    slogan: 'Wealth Awaits You',
    border: 'border-[#D4AF37]/50',
    glow: 'shadow-[#D4AF37]/30'
  }
};

export default function ScratchCardClient({ onBalanceUpdate }) {
  const router = useRouter();
  const { user } = useAuth();
  const [tier, setTier] = useState('bronze');
  const [displayBalance, setDisplayBalance] = useState(null);
  const [isExiting, setIsExiting] = useState(false);
  
  const [gameState, setGameState] = useState('IDLE');
  const gameStateRef = React.useRef('IDLE');
  const [prizeData, setPrizeData] = useState(null);
  const prizeDataRef = React.useRef(null);
  const [flyingNotes, setFlyingNotes] = useState([]);
  const [maxSafeWin, setMaxSafeWin] = useState(null);
  const { play: playSound } = useGameSound();

  // Dynamic Vault Status
  useEffect(() => {
    const fetchVault = async () => {
        try {
            const res = await api.get('/game/vault-status');
            if (res.data.success) setMaxSafeWin(res.data.maxSafeWin);
        } catch (e) { }
    };
    fetchVault();
  }, []);

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
      window.isScratchCardAnimating = true;
      window.unifiedDeferredBalance = null;
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
        if (typeof window !== 'undefined') window.isScratchCardAnimating = false;
        return;
    }

    setGameState('BOUGHT');
    gameStateRef.current = 'BOUGHT';
    setPrizeData(null);
    prizeDataRef.current = null;

    try {
      const { data } = await api.post('/game/scratch-card', { tier });
      setPrizeData(data.result);
      prizeDataRef.current = data.result;
      setGameState('READY_TO_SCRATCH');
      gameStateRef.current = 'READY_TO_SCRATCH';
    } catch (err) {
      if (typeof window !== 'undefined') window.isScratchCardAnimating = false;
      if (baselineBalanceRef.current !== null) {
        setDisplayBalance(baselineBalanceRef.current);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('balance_update', { detail: baselineBalanceRef.current }));
        }
      }
      setGameState('IDLE');
      gameStateRef.current = 'IDLE';
      toast.error(err.response?.data?.message || 'Transaction Failed');
    }
  };

  const onScratchComplete = async () => {
      if (gameStateRef.current === 'BOUGHT') {
          const checkReady = setInterval(() => {
              if (document.getElementById('scratch-card-prize')?.dataset?.ready === 'true') {
                  clearInterval(checkReady);
                  executeReveal();
              }
          }, 100);
          return;
      }
      executeReveal();
  };

  const executeReveal = async () => {
      if (gameStateRef.current === 'REVEALED') return;
      
      setGameState('REVEALED');
      gameStateRef.current = 'REVEALED';
      
      const currentPrize = prizeDataRef.current;

      // 🚀 PARTICLES & FIREWORKS
      if (currentPrize?.amountNXS > 0) {
        // Generate Flying Numbers
        const notes = Array.from({ length: 12 }).map((_, i) => ({
            id: Date.now() + i,
            value: Math.floor(currentPrize.amountNXS / 12) || 1,
            delay: i * 0.1,
            x: Math.random() * 200 - 100,
            size: 0.8 + Math.random() * 1.5
        }));
        setFlyingNotes(notes);
        
        // Auto-cleanup notes after animation finishes
        setTimeout(() => setFlyingNotes([]), 4000);

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
        window.isScratchCardAnimating = false;
        if (window.unifiedDeferredBalance) {
            const tmpDetails = window.unifiedDeferredBalance;
            window.unifiedDeferredBalance = null;
            window.dispatchEvent(new CustomEvent('balance_update', { detail: tmpDetails }));
        }
      }

      setDisplayBalance(prev => {
          const trueBal = Number((parseFloat(prev) + parseFloat(currentPrize?.amountNXS || 0)).toFixed(2));
          if (onBalanceUpdate) onBalanceUpdate(trueBal);
          return trueBal;
      });
  };

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-sm mx-auto relative py-4 font-sans px-3 min-h-[100dvh] flex flex-col justify-center"
        >
            {/* Main Frame Container as requested by user */}
            <div className="w-full bg-[#0F172A]/80 border border-slate-700/50 rounded-3xl p-3 sm:p-5 flex flex-col gap-3 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-md relative overflow-visible">
                
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
                    <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-1.5 px-3 shadow-lg text-right flex items-center gap-2">
                        <p className="text-[#94A3B8] text-[8px] font-bold uppercase tracking-wide font-mono text-left leading-tight">Main<br/>Assets</p>
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
            <div className="text-center relative z-10 shrink-0">
                <h1 className="text-2xl font-black text-white mb-0.5 tracking-tighter flex items-center justify-center gap-2 drop-shadow-xl">
                    <Sparkles className="text-amber-400 w-5 h-5 animate-pulse" /> {TIERS[tier].name}
                </h1>
                <p className="text-amber-500 text-[10px] uppercase tracking-[0.3em] font-black mb-1 animate-pulse">Win Up to {maxSafeWin ? `${maxSafeWin} NXS` : '...'}</p>
                <p className="text-slate-500 text-[8px] px-2 uppercase tracking-widest font-bold opacity-40 italic">Global Luck Multiplier: 1:8 Pool Active</p>
            </div>

            {/* Tier Selector */}
            <div className="flex gap-1.5 justify-center shrink-0 relative z-10">
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
                  <span className="text-xs font-black mb-0 font-mono tracking-widest">{info.name.split(' ')[0]}</span>
                  <span className={`text-[9px] font-bold opacity-80 font-mono tracking-wider ${tier===t ? 'text-white/80' : ''}`}>{info.cost} NXS</span>
                </button>
              ))}
            </div>

            {/* The Precision Reveal Scratch Card */}
            <div className={`relative w-full z-10 flex flex-col items-center justify-center mt-2`}>
                
                {/* Premium Frame Wrapper */}
                <div className={`w-[90%] max-w-[280px] mx-auto aspect-[4/5] relative rounded-[2rem] p-1 shadow-2xl transition-all duration-500 bg-gradient-to-b ${TIERS[tier].btnClass} ${TIERS[tier].glow}`}>
                    
                    <div className="w-full h-full bg-[#0F172A] rounded-[1.8rem] relative overflow-hidden flex flex-col">
                        
                        {/* Static Premium Design (Top Part) */}
                        <div className="absolute top-0 inset-x-0 h-1/2 bg-slate-900/40 pointer-events-none flex flex-col items-center pt-8">
                             <div className={`w-16 h-1 w-1 bg-gradient-to-r ${TIERS[tier].btnClass} rounded-full mb-4 opacity-50`} />
                             <Gift size={32} className={`text-white/20 mb-2`} />
                             <h4 className="text-white/30 text-[9px] uppercase tracking-[0.5em] font-black">Official Lotary System</h4>
                        </div>
                        
                        {/* Static Premium Design (Bottom Part) */}
                        <div className="absolute bottom-0 inset-x-0 h-1/3 bg-slate-950/60 pointer-events-none flex flex-col items-center justify-end pb-8">
                             <p className="text-slate-500 text-[8px] uppercase tracking-[0.3em] font-bold mb-1 opacity-40 italic">Global Luck Multiplier Active</p>
                             <div className="flex gap-1 opacity-20">
                                {[1,2,3,4,5].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-white" />)}
                             </div>
                        </div>

                        {/* Ambient Glow */}
                        <div className={`absolute inset-0 ${TIERS[tier].bgPattern} opacity-50 z-0 pointer-events-none`} />

                        {/* Middle Reward Box - The ONLY scratchable area */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] aspect-square flex items-center justify-center z-10">
                            
                            {/* Inner Box with Prize */}
                            <div className={`w-full h-full relative rounded-2xl overflow-hidden border-[3px] ${TIERS[tier].border} bg-[#0A0F1B] shadow-inner`}>
                                
                                {/* Prize Content */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-0">
                                    <AnimatePresence mode='wait'>
                                        {prizeData && (
                                            <motion.div 
                                                id="scratch-card-prize"
                                                data-ready="true"
                                                initial={{ scale: 0.8, opacity: 0, y: 10 }}
                                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                                className="flex flex-col items-center"
                                            >
                                                {prizeData.amountNXS > 0 ? (
                                                    <div className="relative mb-3">
                                                         <div className="absolute inset-0 blur-2xl opacity-60 bg-amber-400 animate-pulse" />
                                                         <div className="relative bg-gradient-to-br from-amber-300 to-amber-600 w-20 h-20 rounded-full flex items-center justify-center shadow-lg border-2 border-white/20">
                                                             <Coins className="text-white w-10 h-10 drop-shadow-md" />
                                                         </div>
                                                    </div>
                                                ) : (
                                                    <div className="bg-slate-800/80 w-16 h-16 rounded-full flex items-center justify-center mb-3 border border-slate-700">
                                                        <AlertCircle className="text-slate-500 w-8 h-8" />
                                                    </div>
                                                )}
                                                <span className="text-3xl font-black text-white tracking-tighter drop-shadow-lg leading-none mb-1">
                                                    {prizeData.label}
                                                </span>
                                                <span className={`text-xl font-bold font-mono ${prizeData.amountNXS > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                                                    {prizeData.amountNXS > 0 ? `+${prizeData.amountNXS} NXS` : '0 NXS'}
                                                </span>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    
                                    {/* Flying Numbers Overlay */}
                                    {flyingNotes.map(n => (
                                        <FlyingNumber key={n.id} {...n} />
                                    ))}

                                    {!prizeData && (
                                        <div className="flex flex-col items-center gap-2 opacity-50">
                                            <div className="w-8 h-8 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                                            <div className="text-slate-600 font-bold font-mono text-[8px] uppercase tracking-widest">Encrypting Result...</div>
                                        </div>
                                    )}
                                </div>

                                {/* Scratch Overlay - Managed by ScratchCanvas */}
                                {(gameState === 'READY_TO_SCRATCH' || gameState === 'BOUGHT') && (
                                    <div className="absolute inset-0 z-20">
                                        <ScratchCanvas 
                                            width={220} // Adjusted for 80% of inner frame
                                            height={220}
                                            overlayColor={TIERS[tier].cardCover}
                                            accentColor={TIERS[tier].accent}
                                            isReady={gameState === 'READY_TO_SCRATCH' || gameState === 'BOUGHT'}
                                            onComplete={onScratchComplete}
                                            onScratch={() => {
                                                playSound('tick');
                                                const guide = document.getElementById('scratch-guide');
                                                if (guide) guide.style.opacity = '0';
                                            }}
                                        />
                                        
                                        {/* Visual Guide */}
                                        {(gameState === 'READY_TO_SCRATCH' || gameState === 'BOUGHT') && (
                                            <motion.div 
                                                id="scratch-guide"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-30"
                                            >
                                                 <motion.div 
                                                    animate={{ y: [0, -10, 0] }}
                                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                                    className="bg-white/10 backdrop-blur-md p-3 rounded-full border border-white/20 shadow-xl"
                                                 >
                                                    <Pointer size={24} className="text-white drop-shadow-lg" />
                                                 </motion.div>
                                                 <span className="mt-3 text-white/60 font-bold text-[8px] uppercase tracking-[0.4em]">1 Swipe to Reveal</span>
                                            </motion.div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Title & Slogan over the premium design */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[150%] z-20 text-center pointer-events-none mb-4">
                             <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-1 drop-shadow-xl">{TIERS[tier].name.split(' ')[0]}</h3>
                             <p className="text-amber-500/80 text-[8px] uppercase tracking-[0.4em] font-black">{TIERS[tier].slogan}</p>
                        </div>
                    </div>

                    {/* Idle Overlay */}
                    {gameState === 'IDLE' && (
                        <div className="absolute inset-0 z-[40] bg-[#0F172A]/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 text-center rounded-[2rem] border border-white/5">
                             <motion.div 
                                animate={{ scale: [1, 1.05, 1] }}
                                transition={{ repeat: Infinity, duration: 3 }}
                                className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mb-6 shadow-2xl border border-white/5 relative overflow-hidden"
                             >
                                <div className={`absolute inset-0 bg-gradient-to-br ${TIERS[tier].btnClass} opacity-20 blur-xl`} />
                                <Sparkles size={36} className="text-white relative z-10" />
                             </motion.div>
                             
                             <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">{TIERS[tier].name}</h3>
                             <p className="text-amber-400 text-[10px] font-black uppercase tracking-[0.4em] mb-4">{TIERS[tier].slogan}</p>
                             <div className="bg-slate-800/80 px-4 py-2 rounded-xl text-[9px] font-bold text-slate-400 tracking-widest uppercase border border-slate-700">
                                Premium Asset Revealed Instantly
                             </div>
                        </div>
                    )}
                </div>
                
                {/* Buy Button Below the Card */}
                {(gameState === 'IDLE' || gameState === 'REVEALED') && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 mb-2 w-full flex justify-center z-30"
                    >
                        <button 
                            onClick={buyCard}
                            className={`px-6 py-3.5 w-[90%] rounded-[1.5rem] font-black text-lg tracking-tighter shadow-xl border border-white/20 hover:-translate-y-1 active:translate-y-0.5 transition-all bg-gradient-to-r ${TIERS[tier].btnClass} ${TIERS[tier].textClass} uppercase drop-shadow-xl`}
                        >
                            {gameState === 'REVEALED' ? 'Get Another' : `Reveal for ${TIERS[tier].cost} NXS`}
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
