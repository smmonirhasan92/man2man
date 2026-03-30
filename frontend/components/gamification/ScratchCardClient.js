'use client';
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { Coins, AlertCircle, ArrowLeft, Sparkles, Gift, Pointer } from 'lucide-react';
import useGameSound from '../../hooks/useGameSound';
import Link from 'next/link';
import { motion } from 'framer-motion';

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
  
  const [gameState, setGameState] = useState('IDLE');
  const [prizeData, setPrizeData] = useState(null);
  const { play: playSound } = useGameSound();

  useEffect(() => {
    if (user?.wallet?.main && gameState === 'IDLE') {
      setDisplayBalance(Number(user.wallet.main));
    }
  }, [user?.wallet?.main, gameState]);

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
      const { data } = await api.post('/game/luck-test', { tier });
      setPrizeData(data.result);
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
      
      playSound('card-flip'); 
      playSound('click');
      setGameState('REVEALED');
      
      setTimeout(() => {
          playSound(prizeData?.amountNXS > 0 ? 'win' : 'loss');
          
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
      }, 700); 
  };

  return (
    <div className="w-full max-w-md mx-auto relative pt-4 pb-32 font-sans px-4 min-h-[100dvh]">
        {/* Main Frame Container as requested by user */}
        <div className="w-full bg-[#0F172A]/80 border border-slate-700/50 rounded-[2rem] p-4 sm:p-5 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-md relative overflow-visible">
            
            {/* Ambient Background Glow for the frame */}
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 opacity-20 bg-gradient-to-b ${TIERS[tier].btnClass} blur-[50px] pointer-events-none rounded-[2rem]`}></div>

            {/* Header Section */}
            <div className="flex items-center justify-between mb-4 relative z-10">
                <Link href="/dashboard" className="p-2 bg-slate-800 rounded-full cursor-pointer hover:bg-slate-700 shadow-md">
                  <ArrowLeft size={18} className="text-slate-300" />
                </Link>
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
                <h1 className="text-2xl font-black text-white mb-1 tracking-tight flex items-center justify-center gap-2">
                    <Sparkles className="text-amber-400 w-5 h-5" /> One-Click Reward
                </h1>
                <p className="text-slate-400 text-xs px-4">Buy a tier, then tap to instantly flip and win!</p>
            </div>

            {/* Tier Selector */}
            <div className="flex gap-2 justify-center mb-6 shrink-0 relative z-10">
              {Object.entries(TIERS).map(([t, info]) => (
                <button
                  key={t}
                  onClick={() => {
                      if (gameState === 'IDLE' || gameState === 'REVEALED') setTier(t);
                  }}
                  disabled={gameState === 'BOUGHT' || gameState === 'READY_TO_REVEAL'}
                  className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl transition-all duration-300 ${
                    tier === t 
                      ? `bg-gradient-to-br ${info.btnClass} ${info.textClass} shadow-lg shadow-[#1E293B]/50 scale-105 border-2 border-white/20`
                      : 'bg-[#1E293B] text-slate-400 border border-[#334155] hover:bg-slate-800'
                  } ${gameState === 'BOUGHT' || gameState === 'READY_TO_REVEAL' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="text-sm font-black mb-0.5 font-mono tracking-widest">{info.name.split(' ')[0]}</span>
                  <span className={`text-[9px] font-bold opacity-80 font-mono tracking-wider ${tier===t ? 'text-white/80' : ''}`}>{info.cost} NXS</span>
                </button>
              ))}
            </div>

            {/* The Flip Card Container */}
            <div className="relative w-full [perspective:1200px] z-10 flex items-center justify-center mb-5 mt-2">
                <motion.div
                    animate={{ rotateY: gameState === 'REVEALED' ? 180 : 0 }}
                    transition={{ duration: 0.7, type: 'spring', stiffness: 80, damping: 15 }}
                    style={{ transformStyle: 'preserve-3d' }}
                    className="w-full max-w-[300px] aspect-[4/5] sm:aspect-square relative rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-[4px] border-[#1E293B] bg-[#0A0F1A]"
                >
                    {/* Back of Card (Prize) */}
                    <div 
                        className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-0 rounded-3xl overflow-hidden bg-slate-900"
                        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                    >
                        {prizeData ? (
                            <div className="flex flex-col items-center justify-center w-full z-10">
                                {prizeData.amountNXS > 0 ? (
                                   <div className="bg-amber-400/20 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-4 animate-[bounce_1.5s_infinite] shadow-[0_0_40px_rgba(251,191,36,0.3)] border border-amber-500/30">
                                       <Coins className="text-amber-400 drop-shadow-lg w-10 h-10 sm:w-12 sm:h-12" />
                                   </div>
                                ) : (
                                   <div className="bg-slate-700/50 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-4 border border-slate-600/50">
                                       <AlertCircle className="text-slate-400 w-10 h-10 sm:w-12 sm:h-12" />
                                   </div>
                                )}
                                <span className="text-2xl sm:text-3xl font-black text-white font-sans drop-shadow-lg uppercase tracking-tight">{prizeData.label}</span>
                                <span className={`text-xl sm:text-2xl font-black mt-1 font-mono ${prizeData.amountNXS > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                                    {prizeData.amountNXS > 0 ? `+${prizeData.amountNXS} NXS` : '0 NXS'}
                                </span>
                            </div>
                        ) : (
                            <div className="text-slate-600 font-mono animate-pulse z-10 text-sm">Awaiting Unlock...</div>
                        )}
                        
                        {/* Background Pattern for the revealed back part */}
                        <div className={`absolute inset-0 ${TIERS[tier].bgPattern} opacity-50 z-0`} />
                    </div>

                    {/* Front of Card (Cover) */}
                    <div 
                        className={`absolute inset-0 z-10 bg-gradient-to-br ${TIERS[tier].cardCover} shadow-[inset_0_0_80px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center p-6 rounded-3xl overflow-hidden transition-transform duration-300 ${gameState === 'READY_TO_REVEAL' ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
                        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                        onClick={handleRevealClick}
                    >
                        <div className="w-full h-full border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group">
                             {/* Glossy Overlay */}
                             <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-[1200ms] ease-in-out"></div>

                             <Gift size={48} strokeWidth={1.5} className="text-white/90 drop-shadow-lg mb-4 animate-pulse" />
                             
                             {gameState === 'READY_TO_REVEAL' ? (
                                 <motion.button 
                                     animate={{ scale: [1, 1.05, 1] }} 
                                     transition={{ repeat: Infinity, duration: 1.2 }}
                                     className="bg-white/90 backdrop-blur-md text-slate-900 px-5 py-2.5 rounded-full font-black text-sm uppercase tracking-widest shadow-2xl flex items-center gap-2 border border-white/50"
                                     onClick={(e) => { e.stopPropagation(); handleRevealClick(); }}
                                 >
                                     <Pointer size={16} /> Tap To Flip
                                 </motion.button>
                             ) : gameState === 'BOUGHT' ? (
                                 <div className="text-white/80 font-bold font-mono text-xs animate-pulse">Processing...</div>
                             ) : (
                                 <div className="text-center px-2">
                                     <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight drop-shadow-md mb-1">Mystery Box</h3>
                                     <p className="text-white/80 text-[11px] sm:text-xs font-medium leading-tight">Click the buy button to unlock.</p>
                                 </div>
                             )}
                        </div>
                    </div>
                </motion.div>
                
                {/* Floating Buy Button Overlay on top of the Card Container if IDLE */}
                {(gameState === 'IDLE' || gameState === 'REVEALED') && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -bottom-5 w-full flex justify-center z-30 pointer-events-none"
                    >
                        <button 
                            onClick={buyCard}
                            className={`pointer-events-auto px-8 py-3.5 w-11/12 max-w-[260px] rounded-2xl font-black text-lg sm:text-xlt tracking-tight shadow-[0_15px_30px_rgba(0,0,0,0.6)] border border-white/30 hover:-translate-y-1 active:translate-y-1 transition-all bg-gradient-to-r ${TIERS[tier].btnClass} ${TIERS[tier].textClass}`}
                        >
                            {gameState === 'REVEALED' ? 'Play Again' : `Buy For ${TIERS[tier].cost} NXS`}
                        </button>
                    </motion.div>
                )}
            </div>
            
        </div>
    </div>
  );
}
