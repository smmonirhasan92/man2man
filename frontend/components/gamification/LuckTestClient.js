'use client';
import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

const SPIN_DURATION_MS = 5000;
const SLICE_DEG = 45; // 360 / 8 segments

const TIERS = {
  bronze: {
    name: 'Bronze', cost: '1 NXS', costLabel: 'Cost: 1 NXS = $0.02',
    btnClass: 'from-[#CD7F32] to-[#E8A55A]', textClass: 'text-white',
    tabActiveBg: 'bg-[#FFF4EA] border-[#CD7F32]', tabActiveText: 'text-[#8B4513]',
    rtp: '85%', jackpot: '10¢',
    prizesTitle: 'Bronze Prize Table',
    prizes: [
      { label: 'Jackpot',  chance: 'RARE',  amt: '5 NXS',   cls: 'text-[#B8860B]' },
      { label: 'Medium',   chance: 'BOOST', amt: '2 NXS',   cls: 'text-[#2E8B57]'  },
      { label: 'Refund',   chance: 'HIGH',  amt: '1 NXS',   cls: 'text-slate-500'  },
      { label: 'Small',    chance: 'BEST',  amt: '0.5 NXS', cls: 'text-slate-500'   },
      { label: 'Miss',     chance: 'LOW',   amt: '0 NXS',   cls: 'text-slate-400'    },
    ],
    segments: ['#F4A261','#E76F51','#2A9D8F','#E9C46A','#264653','#F4A261','#2A9D8F','#E9C46A'],
    labels:   ['5 NXS','2 NXS','1 NXS','0.5 NXS','0 NXS','1 NXS','0.5 NXS','2 NXS'],
    values:   [5, 2, 1, 0.5, 0, 1, 0.5, 2]
  },
  silver: {
    name: 'Silver', cost: '2.5 NXS', costLabel: 'Cost: 2.5 NXS = $0.05',
    btnClass: 'from-[#909090] to-[#C0C0C0]', textClass: 'text-white',
    tabActiveBg: 'bg-[#F5F5F5] border-[#A0A0A0]', tabActiveText: 'text-[#444]',
    rtp: '84%', jackpot: '25¢',
    prizesTitle: 'Silver Prize Table',
    prizes: [
      { label: 'Jackpot',  chance: 'RARE',  amt: '12.5 NXS', cls: 'text-[#B8860B]' },
      { label: 'Medium',   chance: 'BOOST', amt: '5 NXS',    cls: 'text-[#2E8B57]'  },
      { label: 'Refund',   chance: 'HIGH',  amt: '2.5 NXS',  cls: 'text-slate-500'  },
      { label: 'Small',    chance: 'BEST',  amt: '1 NXS',    cls: 'text-slate-500'   },
      { label: 'Miss',     chance: 'LOW',   amt: '0 NXS',    cls: 'text-slate-400'    },
    ],
    segments: ['#8D8D8D','#B0B0B0','#5E5E5E','#C8C8C8','#333','#9A9A9A','#6E6E6E','#B8B8B8'],
    labels:   ['12.5 NXS','5 NXS','2.5 NXS','1 NXS','0 NXS','2.5 NXS','1 NXS','5 NXS'],
    values:   [12.5, 5, 2.5, 1, 0, 2.5, 1, 5]
  },
  gold: {
    name: 'Gold', cost: '5 NXS', costLabel: 'Cost: 5 NXS = $0.10',
    btnClass: 'from-[#B8860B] to-[#FFD700]', textClass: 'text-[#3B2A00]',
    tabActiveBg: 'bg-[#FFFBE6] border-[#DAA520]', tabActiveText: 'text-[#856404]',
    rtp: '85%', jackpot: '50¢',
    prizesTitle: 'Gold Prize Table',
    prizes: [
      { label: 'Super Jackpot', chance: 'ELITE',  amt: '25 NXS',  cls: 'text-[#B8860B]' },
      { label: 'Medium',        chance: 'MEGA',   amt: '10 NXS',  cls: 'text-[#2E8B57]'  },
      { label: 'Refund',        chance: 'HIGH',   amt: '5 NXS',   cls: 'text-slate-500'  },
      { label: 'Small',         chance: 'GOOD',   amt: '2.5 NXS', cls: 'text-slate-500'   },
      { label: 'Miss',          chance: 'MIN',    amt: '0 NXS',   cls: 'text-slate-400'    },
    ],
    segments: ['#DAA520','#B8860B','#FFD700','#8B6914','#F5C842','#B8860B','#DAA520','#FFD700'],
    labels:   ['25 NXS','10 NXS','5 NXS','2.5 NXS','0 NXS','5 NXS','2.5 NXS','10 NXS'],
    values:   [25, 10, 5, 2.5, 0, 5, 2.5, 10]
  }
};

/** 
 * --- HELPER: Sound Engine ---
 * Expects audio files in /sounds/ folder of the public directory.
 */
const playAudio = (file, muted) => {
  if (muted || typeof window === 'undefined') return;
  const audio = new Audio(`/sounds/${file}`);
  audio.volume = 0.5;
  audio.play().catch(() => {
    // Silence errors if files are missing
    console.warn(`[SoundEngine] File not found: /sounds/${file}. Please upload to public/sounds/.`);
  });
};

function ResultOverlay({ result, onClose, muted }) {
  if (!result) return null;
  const isWin = result.amountNXS > 0;
  const isJackpot = result.cls === 'jackpot';

  useEffect(() => {
    if (isWin) playAudio('win.mp3', muted);
    else playAudio('loss.mp3', muted);
  }, [isWin, muted]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className={`relative max-w-[340px] w-[90%] p-8 rounded-[2.5rem] border text-center shadow-2xl transition-all scale-110
          ${isJackpot ? 'bg-gradient-to-br from-[#1A0F00] to-[#3B2A00] border-[#FFD700]/50' : 
            isWin ? 'bg-gradient-to-br from-[#022C22] to-[#064E3B] border-emerald-500/30' : 
            'bg-gradient-to-br from-[#0F172A] to-[#1E293B] border-slate-700'
          }`}
      >
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-6xl drop-shadow-lg">
          {isJackpot ? '🏆' : isWin ? '🎉' : '🍀'}
        </div>
        
        <h2 className={`mt-4 text-2xl font-black tracking-tight ${isJackpot ? 'text-[#FFD700]' : isWin ? 'text-emerald-400' : 'text-slate-400'}`}>
          {isJackpot ? 'JACKPOT WINNER!' : isWin ? 'Nice Win!' : 'Keep Playing!'}
        </h2>
        
        <div className={`mt-2 text-4xl font-mono font-black ${isJackpot ? 'text-[#FFD700]' : isWin ? 'text-white' : 'text-slate-500'}`}>
          {isWin ? `+${result.amountNXS} NXS` : 'BETTER LUCK'}
        </div>
        
        <p className="mt-2 text-sm text-slate-400">
          {isWin ? `Landed on "${result.label}" - Reward credited!` : 'Stay persistent! Success is just a spin away.'}
        </p>

        <button 
          onClick={onClose}
          className={`mt-8 w-full py-4 rounded-2xl font-bold text-lg shadow-xl hover:scale-105 active:scale-95 transition-all
            ${isJackpot ? 'bg-gradient-to-r from-[#B8860B] to-[#FFD700] text-[#3B2A00]' : 
              isWin ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 text-white' : 
              'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
        >
          {isWin ? 'Great! 🚀' : 'Try Again'}
        </button>
      </div>
    </div>
  );
}

export default function LuckTestClient({ onBalanceUpdate }) {
  const { user } = useAuth();
  const [tier, setTier] = useState('bronze');
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [popup, setPopup] = useState(null);
  const [isPreloading, setIsPreloading] = useState(false);
  const [muted, setMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('game_muted') === 'true';
    }
    return false;
  });
  
  const rotationRef = useRef(0);
  const lastTickIdx = useRef(-1);
  const config = TIERS[tier];

  // Load mute state removed from useEffect to avoid cascading renders

  const toggleMute = () => {
    const newVal = !muted;
    setMuted(newVal);
    localStorage.setItem('game_muted', String(newVal));
  };

  const handleTierSelect = (t) => {
    if (spinning) return;
    setTier(t);
  };

  /**
   * Ticking Sound Processor
   * Monitors the rotation degrees to play 'tick.mp3' when crossing segment boundaries.
   */
  useEffect(() => {
    if (!spinning) return;
    const interval = setInterval(() => {
      // Current logical rotation index (0-7)
      // Since SVG index 0 is at top, we check rotation % 360
      const currentDeg = (rotation - rotationRef.current) % 360;
      const stepIdx = Math.floor(Math.abs(currentDeg) / SLICE_DEG);
      
      if (stepIdx !== lastTickIdx.current) {
        playAudio('tick.mp3', muted);
        lastTickIdx.current = stepIdx;
      }
    }, 50);
    return () => clearInterval(interval);
  }, [spinning, rotation, muted]);

  const doSpin = async () => {
    if (spinning || isPreloading) return;
    setIsPreloading(true);
    setPopup(null);

    let apiResult = null;
    try {
      const { data } = await api.post('/game/luck-test', { tier });
      apiResult = data;
    } catch (err) {
      setIsPreloading(false);
      toast.error(err.response?.data?.message || 'Transaction Failed');
      return;
    }

    setIsPreloading(false);
    setSpinning(true);
    playAudio('spin.mp3', muted);

    const winAmount = apiResult.result.amountNXS;
    const matchingIndices = [];
    config.values.forEach((v, i) => { if (v === winAmount) matchingIndices.push(i); });
    
    const targetIdx = matchingIndices.length > 0 
      ? matchingIndices[Math.floor(Math.random() * matchingIndices.length)] 
      : config.values.indexOf(0);

    const extraLoops = 6 * 360;
    const currentBase = rotationRef.current - (rotationRef.current % 360);
    const targetAngle = currentBase + extraLoops - (targetIdx * SLICE_DEG);
    
    const finalAngle = targetAngle > rotationRef.current ? targetAngle : targetAngle + 360;

    rotationRef.current = finalAngle;
    setRotation(finalAngle);

    setTimeout(() => {
      setSpinning(false);
      setPopup(apiResult.result);
      
      if (apiResult.newBalance !== undefined) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('balance_update', { detail: apiResult.newBalance }));
        }
        if (onBalanceUpdate) onBalanceUpdate(apiResult.newBalance);
      }
    }, SPIN_DURATION_MS);
  };

  const cx = 110, cy = 110, r = 104;
  const sliceRad = (2 * Math.PI) / config.segments.length;

  return (
    <>
      <ResultOverlay result={popup} onClose={() => setPopup(null)} muted={muted} />
      
      <div className="w-full max-w-md mx-auto p-4 md:p-6 bg-[#0B0F1A] min-h-screen text-slate-200 font-sans selection:bg-orange-500/30">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/5 text-orange-400 flex items-center justify-center text-2xl shadow-[0_4px_12px_rgba(0,0,0,0.4)] border border-orange-500/10">
              🎰
            </div>
            <div>
              <h1 className="text-xl font-black text-white leading-none tracking-tight">LUCK TEST</h1>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold">Premium Rewards</p>
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
              <h4 className="text-md font-mono font-black text-emerald-400">{user?.wallet?.main || '0.00'}</h4>
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
                <span className={`text-[11px] font-mono mt-0.5 font-bold ${active ? 'opacity-80' : 'text-slate-400'}`}>{tCfg.cost}</span>
              </button>
            );
          })}
        </div>

        {/* Wheel Section */}
        <div className="flex flex-col items-center mb-8">
          <div className={`relative w-[240px] h-[240px] mb-8 ${isPreloading ? 'animate-pulse scale-95' : ''} transition-all duration-300`}>
            <div className="absolute inset-0 rounded-full border-[8px] border-[#1E293B] shadow-[0_0_20px_rgba(0,0,0,0.8),inset_0_0_10px_rgba(255,255,255,0.05)]" />
            
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
              <div className="w-0 h-0 border-x-[14px] border-x-transparent border-t-[32px] border-t-white filter drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]" />
              <div className="absolute top-0 w-0 h-0 border-x-[10px] border-x-transparent border-t-[24px] border-t-orange-500" />
            </div>

            <svg 
              width="240" height="240" viewBox="0 0 220 220" 
              className="w-full h-full drop-shadow-2xl"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? `transform ${SPIN_DURATION_MS/1000}s cubic-bezier(0.12, 0.8, 0.2, 1)` : 'none'
              }}
            >
              {config.segments.map((color, i) => {
                const start = (i * sliceRad) - (Math.PI / 2) - (sliceRad / 2);
                const end = start + sliceRad;
                const x1 = cx + r * Math.cos(start);
                const y1 = cy + r * Math.sin(start);
                const x2 = cx + r * Math.cos(end);
                const y2 = cy + r * Math.sin(end);
                const mid = start + sliceRad / 2;
                const tx = cx + 68 * Math.cos(mid);
                const ty = cy + 68 * Math.sin(mid);

                return (
                  <g key={i}>
                    <path 
                      d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`} 
                      fill={color} 
                      stroke="rgba(255,255,255,0.05)" 
                      strokeWidth="1"
                    />
                    <text 
                      x={tx} y={ty} 
                      textAnchor="middle" dominantBaseline="middle" 
                      fill="white" fontSize="11" fontWeight="900" 
                      transform={`rotate(${(mid * 180 / Math.PI) + 90}, ${tx}, ${ty})`}
                      className="drop-shadow-sm font-mono"
                    >
                      {config.labels[i]}
                    </text>
                  </g>
                );
              })}
              <circle cx={cx} cy={cy} r="26" fill="#0B0F1A" stroke="#1E293B" strokeWidth="4" />
              <circle cx={cx} cy={cy} r="18" fill="url(#hubGrad)" />
              <defs>
                <linearGradient id="hubGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#0B0F1A" />
                </linearGradient>
              </defs>
            </svg>
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
                  <div className={`w-1.5 h-1.5 rounded-full ${i===0 ? 'bg-orange-400' : 'bg-slate-600'}`} />
                  <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{p.label}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{p.chance}</span>
                  <span className={`text-xs font-mono font-black w-16 text-right ${p.cls}`}>{p.amt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
