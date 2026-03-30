'use client';
import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

const SPIN_DURATION_MS = 5000;
const SLICE_DEG = 45; // 360 / 8 segments

const TIERS = {
  bronze: {
    name: 'Bronze', cost: 1, costLabel: 'Cost: 1 NXS = $0.02',
    btnClass: 'from-[#CD7F32] to-[#E8A55A]', textClass: 'text-white',
    tabActiveBg: 'bg-[#FFF4EA] border-[#CD7F32]', tabActiveText: 'text-[#8B4513]',
    rtp: '85%', jackpot: '10¢',
    prizesTitle: 'Bronze Prize Table',
    prizes: [
      { label: 'Jackpot',  chance: 'RARE',  amt: '5 NXS',   cls: 'text-[#B8860B] bg-[#B8860B]' },
      { label: 'Medium',   chance: 'BOOST', amt: '2 NXS',   cls: 'text-[#2E8B57] bg-[#2E8B57]'  },
      { label: 'Refund',   chance: 'HIGH',  amt: '1 NXS',   cls: 'text-slate-500 bg-slate-500'  },
      { label: 'Small',    chance: 'BEST',  amt: '0.5 NXS', cls: 'text-slate-500 bg-slate-500'   },
      { label: 'Miss',     chance: 'LOW',   amt: '0 NXS',   cls: 'text-slate-400 bg-slate-400'    },
    ],
    slices: [
      { label: '5 NXS', value: 5, color: '#F4A261' },
      { label: '2 NXS', value: 2, color: '#E76F51' },
      { label: '1 NXS', value: 1, color: '#2A9D8F' },
      { label: '0.5 NXS', value: 0.5, color: '#E9C46A' },
      { label: '0 NXS', value: 0, color: '#264653' },
      { label: '1 NXS', value: 1, color: '#F4A261' },
      { label: '0.5 NXS', value: 0.5, color: '#2A9D8F' },
      { label: '2 NXS', value: 2, color: '#E9C46A' }
    ]
  },
  silver: {
    name: 'Silver', cost: 2.5, costLabel: 'Cost: 2.5 NXS = $0.05',
    btnClass: 'from-[#909090] to-[#C0C0C0]', textClass: 'text-white',
    tabActiveBg: 'bg-[#F5F5F5] border-[#A0A0A0]', tabActiveText: 'text-[#444]',
    rtp: '84%', jackpot: '25¢',
    prizesTitle: 'Silver Prize Table',
    prizes: [
      { label: 'Jackpot',  chance: 'RARE',  amt: '12.5 NXS', cls: 'text-[#B8860B] bg-[#B8860B]' },
      { label: 'Medium',   chance: 'BOOST', amt: '5 NXS',    cls: 'text-[#2E8B57] bg-[#2E8B57]'  },
      { label: 'Refund',   chance: 'HIGH',  amt: '2.5 NXS',  cls: 'text-slate-500 bg-slate-500'  },
      { label: 'Small',    chance: 'BEST',  amt: '1 NXS',    cls: 'text-slate-500 bg-slate-500'   },
      { label: 'Miss',     chance: 'LOW',   amt: '0 NXS',    cls: 'text-slate-400 bg-slate-400'    },
    ],
    slices: [
      { label: '12.5 NXS', value: 12.5, color: '#8D8D8D' },
      { label: '5 NXS', value: 5, color: '#B0B0B0' },
      { label: '2.5 NXS', value: 2.5, color: '#5E5E5E' },
      { label: '1 NXS', value: 1, color: '#C8C8C8' },
      { label: '0 NXS', value: 0, color: '#333' },
      { label: '2.5 NXS', value: 2.5, color: '#9A9A9A' },
      { label: '1 NXS', value: 1, color: '#6E6E6E' },
      { label: '5 NXS', value: 5, color: '#B8B8B8' }
    ]
  },
  gold: {
    name: 'Gold', cost: 5, costLabel: 'Cost: 5 NXS = $0.10',
    btnClass: 'from-[#B8860B] to-[#FFD700]', textClass: 'text-[#3B2A00]',
    tabActiveBg: 'bg-[#FFFBE6] border-[#DAA520]', tabActiveText: 'text-[#856404]',
    rtp: '85%', jackpot: '50¢',
    prizesTitle: 'Gold Prize Table',
    prizes: [
      { label: 'Super Jackpot', chance: 'ELITE',  amt: '25 NXS',  cls: 'text-[#B8860B] bg-[#B8860B]' },
      { label: 'Medium',        chance: 'MEGA',   amt: '10 NXS',  cls: 'text-[#2E8B57] bg-[#2E8B57]'  },
      { label: 'Refund',        chance: 'HIGH',   amt: '5 NXS',   cls: 'text-slate-500 bg-slate-500'  },
      { label: 'Small',         chance: 'GOOD',   amt: '2.5 NXS', cls: 'text-slate-500 bg-slate-500'   },
      { label: 'Miss',          chance: 'MIN',    amt: '0 NXS',   cls: 'text-slate-400 bg-slate-400'    },
    ],
    slices: [
      { label: '25 NXS', value: 25, color: '#DAA520' },
      { label: '10 NXS', value: 10, color: '#B8860B' },
      { label: '5 NXS', value: 5, color: '#FFD700' },
      { label: '2.5 NXS', value: 2.5, color: '#8B6914' },
      { label: '0 NXS', value: 0, color: '#F5C842' },
      { label: '5 NXS', value: 5, color: '#B8860B' },
      { label: '2.5 NXS', value: 2.5, color: '#DAA520' },
      { label: '10 NXS', value: 10, color: '#FFD700' }
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
  const [tier, setTier] = useState('bronze');
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [popup, setPopup] = useState(null);
  const [isPreloading, setIsPreloading] = useState(false);
  const [displayBalance, setDisplayBalance] = useState(null);
  const [muted, setMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('game_muted') === 'true';
    }
    return false;
  });
  
  const rotationRef = useRef(0);
  const config = TIERS[tier];

  // Sync initial balance
  useEffect(() => {
    if (user?.wallet?.main && !spinning && !popup) {
      setDisplayBalance(user.wallet.main);
    }
  }, [user?.wallet?.main, spinning, popup]);

  // [P#7] Background Wallet Sync (Periodic Refresh)
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      if (!spinning && !popup) {
        try {
          const { data } = await api.get('/user/profile');
          if (data.success) {
            setDisplayBalance(data.user.wallet.main);
          }
        } catch (err) { console.error('Balance sync failed:', err); }
      }
    }, 30000); // 30 seconds
    return () => clearInterval(syncInterval);
  }, [spinning, popup]);

  const toggleMute = () => {
    const newVal = !muted;
    setMuted(newVal);
    localStorage.setItem('game_muted', String(newVal));
  };

  const handleTierSelect = (t) => {
    if (spinning) return;
    setTier(t);
  };

  const doSpin = async () => {
    setIsPreloading(true);
    
    let apiResult = null;
    try {
      const { data } = await api.post('/game/luck-test', { tier });
      apiResult = data;
    } catch (err) {
      setIsPreloading(false);
      toast.error(err.response?.data?.message || 'Transaction Failed');
      return;
    }

    // [P#2] Delay Balance Update (Do NOT deduct visually at start)
    // We wait for the celebration to update the UI balance.
    if (typeof window !== 'undefined') {
      window.isLuckTestAnimating = true;
      window.deferredLuckTestBalance = null;
    }
    
    setIsPreloading(false);
    setSpinning(true);
    audioQueue.play('spin.mp3', muted);

    // [P#1] Use Server-Side Index for 100% Precision
    const targetIdx = apiResult.result.sliceIndex;
    const winAmount = apiResult.result.amountNXS;

    // [P#1] CSS-based Modular Align Math guarantee
    const loops = 3600; 
    const currentMod = rotationRef.current % 360;
    const jitter = Math.floor(Math.random() * 20) - 10;
    
    // nextRotation: ensure we advance forward, subtract target offset (targetIdx*45)
    const nextRotation = rotationRef.current + loops + (360 - currentMod) - (targetIdx * SLICE_DEG) + jitter;
    rotationRef.current = nextRotation;
    const totalRotation = nextRotation;
    
    console.log(`[LuckTest] TargetIdx: ${targetIdx}, Spin Result: ${winAmount} NXS, Rotation: ${nextRotation}`);
    setRotation(totalRotation);

    setTimeout(() => {
      setSpinning(false);
      setPopup(apiResult.result);
      
      // Update balance ONLY after spin finishes
      if (typeof window !== 'undefined') {
        window.isLuckTestAnimating = false;
        if (window.deferredLuckTestBalance) {
           const tmpDetails = window.deferredLuckTestBalance;
           window.deferredLuckTestBalance = null;
           window.dispatchEvent(new CustomEvent('balance_update', { detail: tmpDetails }));
        }
      }
      
      const finalServerBalance = apiResult.newBalance;
      setDisplayBalance(finalServerBalance);
      if (onBalanceUpdate) onBalanceUpdate(finalServerBalance);
      
      if (winAmount > 0) audioQueue.play('win.mp3', muted);
      else audioQueue.play('loss.mp3', muted);
    }, SPIN_DURATION_MS);
  };


  const cx = 110, cy = 110, r = 104;

  return (
    <>
      <ResultOverlay result={popup} onClose={() => setPopup(null)} />
      
      <div className="w-full max-w-md mx-auto p-4 md:p-6 bg-[#0B0F1A] min-h-screen text-slate-200 font-sans selection:bg-orange-500/30">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/5 text-orange-400 flex items-center justify-center text-2xl shadow-[0_4px_12px_rgba(0,0,0,0.4)] border border-orange-500/10">
              🎰
            </div>
            <div>
              <h1 className="text-xl font-black text-white leading-none tracking-tight">LUCK TEST</h1>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold">Guaranteed Fairness</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleMute}
              className="p-2 rounded-xl bg-[#151B2B] border border-white/5 text-slate-400 hover:text-white transition-colors"
            >
              {muted ? '🔇' : '🔊'}
            </button>
            <div className="bg-[#151B2B] px-4 py-2 rounded-2xl border border-white/5 shadow-inner">
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wide">Main Assets</p>
              <h4 className="text-md font-mono font-black text-emerald-400">{displayBalance || '0.00'}</h4>
            </div>
          </div>
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
                disabled={spinning || isPreloading}
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
          <div className={`relative w-[240px] h-[240px] mb-8 ${isPreloading ? 'scale-95 grayscale' : ''} transition-all duration-300`}>
            {/* CSS Powered Wheel Mechanics */}
            <div 
              className="absolute inset-[6px] rounded-full overflow-hidden"
              style={{
                transform: `rotate(${rotation - 22.5}deg)`,
                transition: spinning ? `transform ${SPIN_DURATION_MS/1000}s cubic-bezier(0.1, 0.7, 0.2, 1)` : 'none',
                background: `conic-gradient(${config.slices.map((s, i) => `${s.color} ${i*45}deg ${(i+1)*45}deg`).join(', ')})`
              }}
            >
              <div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] z-10 pointer-events-none" />
              {config.slices.map((slice, i) => (
                <div 
                  key={i} 
                  className="absolute inset-0 flex items-start justify-center pt-3 drop-shadow-md z-0"
                  style={{ transform: `rotate(${i * 45 + 22.5}deg)` }}
                >
                  <span className="text-white text-[10px] font-mono font-black" style={{ transform: 'rotate(0)' }}>{slice.label}</span>
                </div>
              ))}
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
            disabled={spinning || isPreloading}
            className={`w-full py-5 rounded-[1.5rem] font-black text-xl shadow-2xl transition-all duration-300 tracking-[0.1em] uppercase relative overflow-hidden
              ${(spinning || isPreloading) ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : `bg-gradient-to-r ${config.btnClass} ${config.textClass} hover:opacity-90 active:scale-[0.98] shadow-orange-500/10`}
            `}
          >
            {isPreloading ? 'PREPARING...' : spinning ? 'WINNING...' : 'TAP TO SPIN'}
          </button>
        </div>

        {/* Prize Table */}
        <div className="bg-[#151B2B]/60 rounded-[2rem] p-6 border border-white/5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{config.prizesTitle}</h3>
            <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">{config.rtp} RTP</span>
          </div>
          <div className="space-y-3">
            {config.prizes.map((p, i) => (
              <div key={i} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full ${p.cls.split(' ').pop()} shadow-[0_0_8px_currentColor]`} />
                  <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{p.label}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{p.chance}</span>
                  <span className={`text-xs font-mono font-black w-16 text-right ${p.cls.split(' ')[0]}`}>{p.amt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}

function ResultOverlay({ result, onClose }) {
  if (!result) return null;
  const isWin = result.amountNXS > 0;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
        <div className="text-6xl mb-4">{isWin ? '🎉' : '😢'}</div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
          {isWin ? 'You Won!' : 'Better Luck Next Time'}
        </h2>
        <p className="text-slate-400 mb-6">
          {isWin ? `You received ${result.amountNXS} NXS from the ${result.label} prize.` : 'The spin resulted in a Miss. No rewards this time.'}
        </p>
        <button onClick={onClose} className="w-full py-3 rounded-xl font-bold bg-white/10 text-white hover:bg-white/20 transition-colors">
          Dismiss
        </button>
      </div>
    </div>
  );
}
