'use client';
import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { Gift, Coins, AlertCircle, ArrowLeft, Sparkles } from 'lucide-react';
import useGameSound from '../../hooks/useGameSound';
import Link from 'next/link';

const TIERS = {
  bronze: {
    name: 'Bronze Card', cost: 1, 
    btnClass: 'from-[#CD7F32] to-[#E8A55A]', textClass: 'text-[#8B4513]',
    bgPattern: 'bg-gradient-to-br from-[#CD7F32]/10 to-[#E8A55A]/20'
  },
  silver: {
    name: 'Silver Card', cost: 2.5, 
    btnClass: 'from-[#909090] to-[#C0C0C0]', textClass: 'text-[#444]',
    bgPattern: 'bg-gradient-to-br from-[#909090]/10 to-[#C0C0C0]/20'
  },
  gold: {
    name: 'Gold Card', cost: 5, 
    btnClass: 'from-[#D4AF37] to-[#F3E5AB]', textClass: 'text-[#B8860B]',
    bgPattern: 'bg-gradient-to-br from-[#D4AF37]/10 to-[#F3E5AB]/20'
  }
};

export default function ScratchCardClient({ onBalanceUpdate }) {
  const { user } = useAuth();
  const [tier, setTier] = useState('bronze');
  const [displayBalance, setDisplayBalance] = useState(null);
  
  // Game States
  const [gameState, setGameState] = useState('IDLE'); // IDLE, BOUGHT, SCRATCHING, REVEALED
  const [prizeData, setPrizeData] = useState(null);
  
  const canvasRef = useRef(null);
  const { play: playSound } = useGameSound();
  const ctxRef = useRef(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [scratchedPct, setScratchedPct] = useState(0);

  // Sync initial balance
  useEffect(() => {
    if (user?.wallet?.main && gameState === 'IDLE') {
      setDisplayBalance(Number(user.wallet.main));
    }
  }, [user?.wallet?.main, gameState]);

  // Handle Resize & Canvas Initial Setup
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    // Set device pixel ratio for smooth rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    // Reset composite operation to normal
    ctx.globalCompositeOperation = 'source-over';

    // Fill the canvas with silver/grey "scratch card" foil
    ctx.fillStyle = '#b3b3b3';
    ctx.fillRect(0, 0, rect.width, rect.height);
    
    // Add some noise/pattern to look like foil
    for(let i=0; i<300; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#a8a8a8' : '#c2c2c2';
        ctx.fillRect(Math.random() * rect.width, Math.random() * rect.height, 4, 4);
    }
    
    // Draw "SCRATCH ME" text
    ctx.font = 'bold 30px Arial';
    ctx.fillStyle = '#808080';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SCRATCH HERE', rect.width / 2, rect.height / 2);

    ctxRef.current = ctx;
    setScratchedPct(0);
  };

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
    initCanvas();

    try {
      const { data } = await api.post('/game/luck-test', { tier });
      setPrizeData(data.result);
      setGameState('SCRATCHING');
    } catch (err) {
      // Revert if API fails
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

  const calculateScratchedSurface = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = ctxRef.current;
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    
    let transparentPixels = 0;
    // Walk by 4 bytes (RGBA), checking alpha channel (index 3)
    const stride = 16; 
    let totalSampled = 0;
    
    for (let i = 0; i < pixels.length; i += 4 * stride) {
        if (pixels[i + 3] < 128) {
            transparentPixels++;
        }
        totalSampled++;
    }
    
    const pct = (transparentPixels / totalSampled) * 100;
    setScratchedPct(pct);
    
    if (pct > 30 && gameState === 'SCRATCHING') {
       revealCard();
    }
  };

  const revealCard = () => {
      setGameState('REVEALED');
      playSound(prizeData?.amountNXS > 0 ? 'win' : 'lose');
      
      // Clear the remaining canvas instantly
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (canvas && ctx) {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Unlock Balance (Spoiler Guard Output)
      if (typeof window !== 'undefined') {
        window.isLuckTestAnimating = false;
        if (window.deferredLuckTestBalance) {
           const tmpDetails = window.deferredLuckTestBalance;
           window.deferredLuckTestBalance = null;
           window.dispatchEvent(new CustomEvent('balance_update', { detail: tmpDetails }));
        }
      }

      // Re-sync UI local balance
      const trueBal = Number((parseFloat(displayBalance) + parseFloat(prizeData?.amountNXS || 0)).toFixed(2));
      setDisplayBalance(trueBal);
      if (onBalanceUpdate) onBalanceUpdate(trueBal);
  };

  // Canvas Drawing Handlers
  const handlePointerDown = (e) => {
    if (gameState !== 'SCRATCHING') return;
    setIsDrawing(true);
    scratch(e);
  };
  
  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    calculateScratchedSurface();
  };
  
  const handlePointerMove = (e) => {
    if (!isDrawing || gameState !== 'SCRATCHING') return;
    scratch(e);
  };

  const scratch = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = ctxRef.current;
    
    const rect = canvas.getBoundingClientRect();
    
    // Handle both touch and mouse coords
    const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
    
    const x = (clientX - rect.left);
    const y = (clientY - rect.top);
    
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 60, 0, Math.PI * 2, false);
    ctx.fill();
    
    // Play sound occasionally
    if (Math.random() < 0.1) playSound('click');
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
        <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-white mb-2 tracking-tight flex items-center justify-center gap-2">
                <Sparkles className="text-amber-400" /> Scratch & Win
            </h1>
            <p className="text-slate-400 text-sm">Choose a card, scratch the foil, and reveal your prize.</p>
        </div>

        {/* Tier Selector */}
        <div className="flex gap-3 justify-center mb-8">
          {Object.entries(TIERS).map(([t, info]) => (
            <button
              key={t}
              onClick={() => {
                  if (gameState === 'IDLE' || gameState === 'REVEALED') setTier(t);
              }}
              disabled={gameState === 'BOUGHT' || gameState === 'SCRATCHING'}
              className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all duration-300 ${
                tier === t 
                  ? `bg-gradient-to-br ${info.btnClass} ${info.textClass} shadow-lg shadow-[#1E293B]/50 scale-105 border-2 border-white/20`
                  : 'bg-[#1E293B] text-slate-400 border-2 border-[#334155] hover:bg-slate-800'
              } ${gameState === 'BOUGHT' || gameState === 'SCRATCHING' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="text-sm font-black mb-1 font-mono tracking-widest">{info.name.split(' ')[0]}</span>
              <span className={`text-[10px] font-bold opacity-80 font-mono tracking-wider ${tier===t ? 'text-white/80' : ''}`}>{info.cost} NXS</span>
            </button>
          ))}
        </div>

        {/* The Scratch Card Container */}
        <div className="relative w-full aspect-[3/2] rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)] border-[4px] border-[#1E293B]">
            {/* Background Pattern */}
            <div className={`absolute inset-0 ${TIERS[tier].bgPattern} transition-colors duration-500`} />
            
            {/* The Revealed Prize Underneath */}
            <div className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300 ${(gameState === 'SCRATCHING' || gameState === 'REVEALED') ? 'opacity-100' : 'opacity-0'}`}>
                {prizeData ? (
                    <>
                        {prizeData.amountNXS > 0 ? (
                           <div className="bg-amber-400/20 w-20 h-20 rounded-full flex items-center justify-center mb-2 animate-bounce">
                               <Coins size={40} className="text-amber-400 drop-shadow-lg" />
                           </div>
                        ) : (
                           <div className="bg-slate-700/50 w-20 h-20 rounded-full flex items-center justify-center mb-2">
                               <AlertCircle size={40} className="text-slate-400" />
                           </div>
                        )}
                        <span className="text-4xl font-black text-white font-mono drop-shadow-lg">{prizeData.label}</span>
                        <span className={`text-xl font-bold mt-2 font-mono ${prizeData.amountNXS > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                            {prizeData.amountNXS > 0 ? `+${prizeData.amountNXS} NXS` : '0 NXS'}
                        </span>
                    </>
                ) : (
                    <div className="animate-pulse flex flex-col items-center justify-center h-full">Loading Prize...</div>
                )}
            </div>

            {/* The Scratch Foil Canvas */}
            <div className={`absolute inset-0 transition-opacity duration-700 z-10 ${gameState === 'REVEALED' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <canvas 
                    ref={canvasRef}
                    className="w-full h-full cursor-crosshair touch-none"
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                    onPointerOut={handlePointerUp}
                    onPointerMove={handlePointerMove}
                />
            </div>
            
            {/* Idle Overlay Button to Start */}
            {(gameState === 'IDLE' || gameState === 'REVEALED') && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0B0F1A]/80 backdrop-blur-[2px]">
                    {gameState === 'REVEALED' && (
                        <div className="bg-[#1E293B] px-6 py-2 rounded-full mb-6 border border-slate-700 shadow-xl">
                            <span className="text-white font-bold font-mono">Card Completely Scratched!</span>
                        </div>
                    )}
                    <button 
                        onClick={buyCard}
                        className={`px-8 py-4 rounded-full font-black text-xl tracking-tight shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all bg-gradient-to-r ${TIERS[tier].btnClass} ${TIERS[tier].textClass}`}
                    >
                        {gameState === 'REVEALED' ? 'Buy Another Card' : `Buy ${TIERS[tier].name}`}
                    </button>
                    <span className="mt-4 text-slate-300 text-sm font-mono bg-black/50 px-3 py-1 rounded-lg border border-slate-700/50">Cost: {TIERS[tier].cost} NXS</span>
                </div>
            )}
        </div>
        
        {/* Progress Bar */}
        {gameState === 'SCRATCHING' && (
            <div className="mt-6">
                <div className="flex justify-between items-center mb-2 px-1">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Erasing Foil...</span>
                    <span className="text-amber-400 text-xs font-black font-mono">{Math.floor(scratchedPct)}% / 30%</span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-[#1E293B]">
                    <div 
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-150"
                        style={{ width: `${Math.min(100, (scratchedPct / 30) * 100)}%` }}
                    />
                </div>
                <p className="text-center text-slate-500 text-[11px] mt-3 uppercase tracking-widest font-bold">
                    Wipe away 30% to auto-reveal
                </p>
            </div>
        )}
    </div>
  );
}
