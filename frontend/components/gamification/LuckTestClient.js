'use client';
import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { socket } from '../../services/socket';

const SPIN_DURATION_MS = 2800;
const SLICE_DEG = 45; // 360 / 8 segments

const TIERS = {
  bronze: {
    name: 'Bronze', cost: 3,
    btnClass: 'from-[#CD7F32] to-[#E8A55A]', textClass: 'text-white',
    tabActiveBg: 'bg-[#FFF4EA] border-[#CD7F32]', tabActiveText: 'text-[#8B4513]',
    slices: [
      { label: '5x',    value: 5.0, color: '#F4A261' },
      { label: '3.3x',  value: 3.3, color: '#E76F51' },
      { label: '2.6x',  value: 2.6, color: '#2A9D8F' }, 
      { label: '2x',    value: 2.0, color: '#E9C46A' },
      { label: '1.5x',  // Label mapping for 1.5x is Index 4
        value: 1.5,  color: '#E9C46B' }, 
      { label: '1x',    value: 1.0, color: '#F4A261' }, 
      { label: '0.5x',  value: 0.5, color: '#2A9D8F' },
      { label: '0x',    value: 0.0, color: '#264653' }
    ]
  },
  silver: {
    name: 'Silver', cost: 6,
    btnClass: 'from-[#909090] to-[#C0C0C0]', textClass: 'text-white',
    tabActiveBg: 'bg-[#F5F5F5] border-[#A0A0A0]', tabActiveText: 'text-[#444]',
    slices: [
      { label: '5x',    value: 5.0, color: '#8D8D8D' },
      { label: '3.3x',  value: 3.3, color: '#B0B0B0' },
      { label: '2.6x',  value: 2.6, color: '#5E5E5E' },
      { label: '2x',    value: 2.0, color: '#C8C8C8' },
      { label: '1.5x',  value: 1.5, color: '#B8B8B8' }, 
      { label: '1x',    value: 1.0, color: '#9A9A9A' },
      { label: '0.5x',  value: 0.5, color: '#6E6E6E' },
      { label: '0x',    value: 0.0, color: '#333' }
    ]
  },
  gold: {
    name: 'Gold', cost: 9,
    btnClass: 'from-[#B8860B] to-[#FFD700]', textClass: 'text-[#3B2A00]',
    tabActiveBg: 'bg-[#FFFBE6] border-[#DAA520]', tabActiveText: 'text-[#856404]',
    slices: [
      { label: '5x',    value: 5.0, color: '#DAA520' },
      { label: '3.3x',  value: 3.3, color: '#B8860B' },
      { label: '2.6x',  value: 2.6, color: '#FFD700' },
      { label: '2x',    value: 2.0, color: '#8B6914' },
      { label: '1.5x',  value: 1.5, color: '#FFD700' },
      { label: '1x',    value: 1.0, color: '#B8860B' },
      { label: '0.5x',  value: 0.5, color: '#DAA520' },
      { label: '0x',    value: 0.0, color: '#F5C842' }
    ]
  }
};


/** 
 * [P#6] Audio Queue System
 * Prevents sound conflicts and ensures professional playback.
 */
class AudioQueue {
  constructor() {
    this.queue = [];
    this.isPlaying = false;
  }
  async play(file, muted) {
    if (muted || typeof window === 'undefined') return;
    this.queue.push(file);
    if (this.isPlaying) return;
    this.isPlaying = true;
    while (this.queue.length > 0) {
      const audioFile = this.queue.shift();
      try {
        const audio = new Audio(`/sounds/${audioFile}`);
        audio.volume = 0.5;
        await new Promise((resolve) => {
          audio.onended = resolve;
          audio.onerror = resolve;
          audio.play().catch(resolve);
        });
      } catch (e) { console.warn(`Audio failed: ${audioFile}`); }
    }
    this.isPlaying = false;
  }
}

const audioQueue = new AudioQueue();

export default function LuckTestClient({ onBalanceUpdate }) {
  const { user } = useAuth();
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);
  const [tier, setTier] = useState('bronze');
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [popup, setPopup] = useState(null);
  const [isPreloading, setIsPreloading] = useState(false);
  const [displayBalance, setDisplayBalance] = useState(null);
  const [cooldownMs, setCooldownMs] = useState(0);
  const [cooldownActive, setCooldownActive] = useState(false);
  const [engineMode, setEngineMode] = useState('single'); 
  const [msg, setMsg] = useState({ text: '', type: '' }); 
  const [muted, setMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('game_muted') === 'true';
    }
    return false;
  });

  // Auto-clear soft notifications for a premium feel
  useEffect(() => {
    if (msg.text) {
      const timer = setTimeout(() => setMsg({ text: '', type: '' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [msg.text]);
  const [maxSafeWin, setMaxSafeWin] = useState(null);
  
  const config = TIERS[tier];

  // [NEW] Live Metric Heartbeat
  useEffect(() => {
    if (socket && typeof window !== 'undefined') {
        const emitStart = () => socket.emit('start_game', 'spin');
        
        // If already connected, broadcast immediately
        if (socket.connected) {
            emitStart();
        } else {
            socket.emit('start_game', 'spin'); // fallback
        }
        
        // If connection drops, we lose state on server. Re-establish on connect.
        socket.on('connect', emitStart);

        const handleEngineState = (data) => {
            if (data.gameType === 'spin' || data.gameType === 'global') {
                setEngineMode(data.mode);
            }
        };
        socket.on('engine_state', handleEngineState);

        return () => {
            socket.off('connect', emitStart);
            socket.off('engine_state', handleEngineState);
            socket.emit('leave_game', 'spin');
        };
    }
  }, []);

  // Fetch Vault Payout Limits
  useEffect(() => {
    const fetchVault = async () => {
        try {
            const res = await api.get('/game/vault-status');
            if (res.data.success) {
                setMaxSafeWin(res.data.maxSafeWin);
            }
        } catch (e) { }
    };
    fetchVault();
  }, []);

  // Sync initial balance
  useEffect(() => {
    if (user?.wallet?.main && !spinning && !popup) {
      setDisplayBalance(user.wallet.main);
    }
  }, [user?.wallet?.main, spinning, popup]);

  // Session Cooldown Timer
  useEffect(() => {
    let interval;
    if (cooldownActive && cooldownMs > 0) {
      interval = setInterval(() => {
        setCooldownMs((prev) => {
          if (prev <= 1000) {
            setCooldownActive(false);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
    } else if (cooldownMs <= 0) {
      setCooldownActive(false);
    }
    return () => clearInterval(interval);
  }, [cooldownActive, cooldownMs]);

  const formatCooldown = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // [P#7] Background Wallet Sync (Periodic Refresh)
  // [REMOVED] Redundant interval. Now handled by centralized AuthContext single listener.

  const toggleMute = () => {
    const newVal = !muted;
    setMuted(newVal);
    localStorage.setItem('game_muted', String(newVal));
  };

  const handleTierSelect = (t) => {
    if (spinning) return;
    setTier(t);
  };

  const handleExit = () => {
    if (spinning) return;
    setIsExiting(true);
    audioQueue.play('click-v2.mp3', muted);
    setTimeout(() => {
      router.push('/dashboard');
    }, 300)
  };

  const doSpin = async () => {
    // [P#2] SERVER SPOILER GUARD (ACTIVATE PRE-FLIGHT)
    // Instantly lock all global socket interceptions before the network hits the backend.
    if (typeof window !== 'undefined') {
      window.isLuckTestAnimating = true;
      window.unifiedDeferredBalance = null;
    }

    // [P#3] VISUAL OPTIMISTIC DEDUCTION (Upfront Betting Action)
    // Physically deducts the cost directly upon tapping to enforce true UI flow.
    let baselineBalance = displayBalance;
    const currentCost = TIERS[tier].cost;
    
    if (baselineBalance !== null && baselineBalance >= currentCost) {
      const predicted = parseFloat((baselineBalance - currentCost).toFixed(2));
      setDisplayBalance(predicted);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('balance_update', { detail: predicted }));
      }
    }

    setSpinning(true);
    // [OPTIMISTIC ACTION] Start indefinite spin loop immediately for "Instant Feel"
    const startInfiniteRotation = rotation + 10000; // Large number to keep it spinning
    setRotation(startInfiniteRotation);
    
    audioQueue.play('spin-v2.mp3', muted);

    let apiResult = null;
    
    try {
      const { data } = await api.post('/game/luck-test', { tier });
      apiResult = data;
    } catch (err) {
      if (typeof window !== 'undefined') window.isLuckTestAnimating = false;
      if (baselineBalance !== null) {
        setDisplayBalance(baselineBalance);
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('balance_update', { detail: baselineBalance }));
      }
      setIsPreloading(false);
      setSpinning(false);
      
      const errorMsg = err.response?.data?.message || 'Transaction Failed';
      setMsg({ text: errorMsg, type: 'error' });
      return;
    }
    
    // Preloading fake delay removed for speed. Result now transitions smoothly from the active rotation.
    // setIsPreloading(false); // Removed

    // CSS-powered Target Resolution logic
    const targetIdx = apiResult.result.sliceIndex;
    const winAmount = apiResult.result.amountNXS;
    const isNearMiss = apiResult.result.label === 'আহ্! অল্পের জন্য মিস!' || apiResult.result.label === 'So Close!';

    const loops = 1800; // Final 5 loops
    const currentMod = rotation % 360;
    let jitter = Math.floor(Math.random() * 20) - 10;
    
    const nextRotation = rotation + loops + (360 - currentMod) - (targetIdx * SLICE_DEG) + jitter;
    setRotation(nextRotation);

    setTimeout(() => {
      setSpinning(false);
      setPopup(apiResult.result);
      
      // STRICT SYNCHRONIZATION: Wallet unlocks only precisely when wheel stops
      if (typeof window !== 'undefined') {
        window.isLuckTestAnimating = false;
        if (window.unifiedDeferredBalance) {
           const tmpDetails = window.unifiedDeferredBalance;
           window.unifiedDeferredBalance = null;
           window.dispatchEvent(new CustomEvent('balance_update', { detail: tmpDetails }));
        }
      }
      
      const finalServerBalance = apiResult.newBalance;
      setDisplayBalance(finalServerBalance);
      if (onBalanceUpdate) onBalanceUpdate(finalServerBalance);
      
      if (winAmount > 0) audioQueue.play('win-v2.mp3', muted);
      else audioQueue.play('loss-v2.mp3', muted);
    }, SPIN_DURATION_MS);
  };


  const cx = 110, cy = 110, r = 104;

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ResultOverlay result={popup} onClose={() => setPopup(null)} />
          
          <div className="w-full max-w-md mx-auto p-4 md:p-6 bg-[#0B0F1A] min-h-screen text-slate-200 font-sans selection:bg-orange-500/30 relative overflow-hidden">
            
            {/* Session Cooldown Overlay */}
            {cooldownActive && (
              <div className="absolute inset-0 z-[60] bg-[#0B0F1A]/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center sm:pb-24">
                <div className="text-6xl mb-6 animate-bounce filter drop-shadow-[0_0_20px_rgba(249,115,22,0.5)]">☕</div>
                <h3 className="text-3xl font-black text-white mb-3 uppercase tracking-wider text-orange-400">Take a breath</h3>
                <p className="text-slate-400 mb-8 font-medium leading-relaxed max-w-[280px]">
                  You've been playing actively! Take a short rest to continue.
                </p>
                <div className="bg-[#151B2B] px-8 py-5 rounded-3xl border border-white/5 w-full shadow-inner ring-1 ring-white/5">
                     <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mb-2">Next Session Starts In</p>
                     <h4 className="text-5xl font-mono text-orange-400 font-black tracking-widest">{formatCooldown(cooldownMs)}</h4>
                </div>
              </div>
            )}
            
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleExit}
                  className="p-2 mr-1 rounded-xl bg-[#151B2B] border border-white/5 text-slate-400 hover:text-white transition-all active:scale-95"
                >
                  <ArrowLeft size={18} />
                </button>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/5 text-orange-400 flex items-center justify-center text-2xl shadow-[0_4px_12px_rgba(0,0,0,0.4)] border border-orange-500/10">
                  🎰
                </div>
                <div>
                  <h1 className="text-xl font-black text-white leading-none tracking-tight">LUCK TEST</h1>
                  <p className="text-[10px] text-orange-500 mt-1 uppercase tracking-widest font-black animate-pulse">
                     Win Up to {maxSafeWin ? `${maxSafeWin} NXS` : '...'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={toggleMute}
                  className="p-2 rounded-xl bg-[#151B2B] border border-white/5 text-slate-400 hover:text-white transition-colors"
                >
                  {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <div className="bg-[#151B2B] px-4 py-2 rounded-2xl border border-white/5 shadow-inner relative">
                  {/* P2P Mode Indicator Light */}
                  <div className="absolute -top-1.5 -right-1.5 flex items-center gap-1">
                    <div className={`w-2.5 h-2.5 rounded-full transition-all duration-700 ${
                      engineMode === 'p2p'
                        ? 'bg-emerald-400 shadow-[0_0_10px_3px_#34d399] animate-pulse'
                        : 'bg-slate-700 shadow-none'
                    }`} />
                  </div>
                  
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">Main Assets</p>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-md font-mono font-black text-emerald-400">{displayBalance || '0.00'}</h4>
                  </div>
                </div>
              </div>
            </div>

        {/* [MASTER CLASS] SOFT NOTIFICATION OVERLAY */}
        <div className="relative h-2 mb-2">
            {msg.text && (
              <div className={`absolute -top-10 left-0 right-0 py-2 px-4 rounded-xl text-center text-[10px] font-black uppercase tracking-widest z-50 animate-in fade-in slide-in-from-top-2 duration-300 border ${
                msg.type === 'error' ? 'bg-rose-950/80 text-rose-200 border-rose-500/50 shadow-lg shadow-rose-900/20' : 'bg-emerald-950/80 text-emerald-200 border-emerald-500/50 shadow-lg shadow-emerald-900/40'
              }`}>
                {msg.text}
              </div>
            )}
        </div>

        {/* Tier Control */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {['bronze', 'silver', 'gold'].map((t) => {
            const tCfg = TIERS[t];
            const active = tier === t;
            return (
              <button 
                key={t}
                onClick={() => handleTierSelect(t)}
                disabled={spinning}
                className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden
                  ${active ? `${tCfg.tabActiveBg} scale-105 shadow-xl` : 'bg-[#151B2B] border-white/5 hover:border-white/10'}
                `}
              >
                {active && <div className="absolute inset-0 bg-white/5 animate-pulse" />}
                <span className="text-2xl mb-1 filter drop-shadow-md">{t === 'bronze' ? '🥉' : t === 'silver' ? '🥈' : '🥇'}</span>
                <span className={`text-[10px] font-black uppercase tracking-wider ${active ? tCfg.tabActiveText : 'text-slate-500'}`}>{tCfg.name}</span>
                <span className={`text-[11px] font-mono mt-0.5 font-bold ${active ? 'opacity-80' : 'text-slate-400'}`}>{tCfg.cost} NXS</span>
              </button>
            );
          })}
        </div>

        {/* Wheel Section */}
        <div className="flex flex-col items-center mb-8">
          <div className={`relative w-[240px] h-[240px] mb-8 transition-all duration-300`}>
            {/* CSS Powered Wheel Container */}
            <div 
              className="absolute inset-0 z-0" 
              style={{ 
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.1, 0, 0, 1)` : 'none'
              }}
            >
              <div 
                className="absolute inset-[6px] rounded-full overflow-hidden"
                style={{
                  transform: `rotate(-22.5deg)`,
                  background: `conic-gradient(${config.slices.map((s, i) => `${s.color} ${i*45}deg ${(i+1)*45}deg`).join(', ')})`
                }}
              >
                <div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] z-10 pointer-events-none" />
                {config.slices.map((slice, i) => (
                  <div 
                    key={i} 
                    className="absolute inset-0 flex items-start justify-center pt-5 drop-shadow-md z-0"
                    style={{ transform: `rotate(${i * 45 + 22.5}deg)` }}
                  >
                    <span className="text-white text-xl font-mono font-black filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" style={{ transform: 'rotate(0)' }}>{slice.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Outer Ring Overlay */}
            <div className="absolute inset-0 rounded-full border-[8px] border-[#1E293B] shadow-[0_0_20px_rgba(0,0,0,0.8),inset_0_0_10px_rgba(255,255,255,0.05)] z-20 pointer-events-none" />
            
            {/* Center Hub */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[52px] h-[52px] bg-[#0B0F1A] rounded-full z-20 flex items-center justify-center border-[4px] border-[#1E293B] shadow-[0_0_15px_rgba(0,0,0,0.8)]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#334155] to-[#0B0F1A]" />
            </div>

            {/* Pointer (Orange Arrow) */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
              <div className="w-0 h-0 border-x-[14px] border-x-transparent border-t-[32px] border-t-white filter drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]" />
              <div className="absolute top-0 w-0 h-0 border-x-[10px] border-x-transparent border-t-[24px] border-t-orange-500" />
            </div>
          </div>

          <button
            onClick={doSpin}
            disabled={spinning}
            className={`w-full py-5 rounded-[1.5rem] font-black text-xl shadow-2xl transition-all duration-300 tracking-[0.1em] uppercase relative overflow-hidden
              ${spinning ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : `bg-gradient-to-r ${config.btnClass} ${config.textClass} hover:opacity-90 active:scale-[0.98] shadow-orange-500/10`}
            `}
          >
            {spinning ? 'SPINNING...' : 'TAP TO SPIN'}
          </button>
        </div>


          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ResultOverlay({ result, onClose }) {
  if (!result) return null;
  const isWin = result.amountNXS > 0;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
        <div className="text-6xl mb-4">
          {isWin ? '🎉' : '😢'}
        </div>
        
        <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
          {isWin ? 'You Won!' : 'Better Luck Next Time'}
        </h2>
        <p className="text-slate-400 mb-6">
          {isWin ? `You received ${result.amountNXS} NXS from the ${result.label} prize.` : 'The spin resulted in a Miss. No rewards this time.'}
        </p>
        
        <button onClick={onClose} className="w-full py-3 rounded-xl font-bold transition-colors shadow-lg bg-white/10 text-white hover:bg-white/20">
          Dismiss
        </button>
      </div>
    </div>
  );
}
