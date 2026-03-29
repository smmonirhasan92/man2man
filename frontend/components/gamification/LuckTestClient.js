'use client';
import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const TIERS = {
  bronze: {
    name: 'Bronze', cost: '1 NXS', costLabel: 'Cost: 1 NXS = $0.02',
    btnClass: 'from-[#CD7F32] to-[#E8A55A]', textClass: 'text-white',
    tabActiveBg: 'bg-[#FFF4EA] border-[#CD7F32]', tabActiveText: 'text-[#8B4513]',
    rtp: '85%', jackpot: '10¢',
    prizesTitle: 'Bronze Prize Table',
    prizes: [
      { label: '🎉 Jackpot',  chance: '2%',  amt: '10¢', cls: 'text-[#B8860B]' },
      { label: '🥇 Medium',   chance: '10%', amt: '4¢',  cls: 'text-[#2E8B57]'  },
      { label: '🔄 Refund',   chance: '40%', amt: '2¢',  cls: 'text-slate-500'  },
      { label: '💰 Small',    chance: '30%', amt: '1¢',  cls: 'text-slate-500'   },
      { label: '🚫 Miss',     chance: '18%', amt: '0¢',  cls: 'text-slate-400'    },
    ],
    segments: ['#F4A261','#E76F51','#2A9D8F','#E9C46A','#264653','#F4A261','#2A9D8F','#E9C46A'],
    labels:   ['10¢','4¢','2¢','1¢','0¢','2¢','1¢','4¢'],
    values:   [5, 2, 1, 0.5, 0, 1, 0.5, 2] // NXS equivalents
  },
  silver: {
    name: 'Silver', cost: '2.5 NXS', costLabel: 'Cost: 2.5 NXS = $0.05',
    btnClass: 'from-[#909090] to-[#C0C0C0]', textClass: 'text-white',
    tabActiveBg: 'bg-[#F5F5F5] border-[#A0A0A0]', tabActiveText: 'text-[#444]',
    rtp: '84%', jackpot: '25¢',
    prizesTitle: 'Silver Prize Table',
    prizes: [
      { label: '🎉 Jackpot',  chance: '2%',  amt: '25¢', cls: 'text-[#B8860B]' },
      { label: '🥇 Medium',   chance: '15%', amt: '10¢', cls: 'text-[#2E8B57]'  },
      { label: '🔄 Refund',   chance: '30%', amt: '5¢',  cls: 'text-slate-500'  },
      { label: '💰 Small',    chance: '35%', amt: '2¢',  cls: 'text-slate-500'   },
      { label: '🚫 Miss',     chance: '18%', amt: '0¢',  cls: 'text-slate-400'    },
    ],
    segments: ['#8D8D8D','#B0B0B0','#5E5E5E','#C8C8C8','#333','#9A9A9A','#6E6E6E','#B8B8B8'],
    labels:   ['25¢','10¢','5¢','2¢','0¢','5¢','2¢','10¢'],
    values:   [12.5, 5, 2.5, 1, 0, 2.5, 1, 5]
  },
  gold: {
    name: 'Gold', cost: '5 NXS', costLabel: 'Cost: 5 NXS = $0.10',
    btnClass: 'from-[#B8860B] to-[#FFD700]', textClass: 'text-[#3B2A00]',
    tabActiveBg: 'bg-[#FFFBE6] border-[#DAA520]', tabActiveText: 'text-[#856404]',
    rtp: '85%', jackpot: '50¢',
    prizesTitle: 'Gold Prize Table',
    prizes: [
      { label: '👑 Super Jackpot', chance: '1%',  amt: '50¢', cls: 'text-[#B8860B]' },
      { label: '🥇 Medium',        chance: '15%', amt: '20¢', cls: 'text-[#2E8B57]'  },
      { label: '🔄 Refund',        chance: '30%', amt: '10¢', cls: 'text-slate-500'  },
      { label: '💰 Small',         chance: '40%', amt: '5¢',  cls: 'text-slate-500'   },
      { label: '🚫 Miss',          chance: '14%', amt: '0¢',  cls: 'text-slate-400'    },
    ],
    segments: ['#DAA520','#B8860B','#FFD700','#8B6914','#F5C842','#B8860B','#DAA520','#FFD700'],
    labels:   ['50¢','20¢','10¢','5¢','0¢','10¢','5¢','20¢'],
    values:   [25, 10, 5, 2.5, 0, 5, 2.5, 10]
  }
};

export default function LuckTestClient({ onBalanceUpdate }) {
  const [tier, setTier] = useState('bronze');
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null); // { isWin: bool, amt: string, label: string }
  const clickAudioRef = useRef(null);

  useEffect(() => {
    clickAudioRef.current = new Audio('/click.mp3'); // short tick sound inside public/
    clickAudioRef.current.volume = 0.5;
  }, []);

  const cfg = TIERS[tier];

  const handleTierSelect = (t) => {
    if (spinning) return;
    setTier(t);
    setResult(null);
  };

  const doSpin = async () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);

    // Initial safe rotation (fake spin while loading)
    const initRotation = rotation + 720; // 2 extra loops
    setRotation(initRotation);

    try {
      const res = await api.post('/game/luck-test', { tier });
      // Example api response: { success: true, result: { amountNXS: 5, label: "Medium", cls: "medium" } }
      const winAmount = res.data.result.amountNXS;
      
      // Match amountNXS to find matching segment indices in UI
      const matchingIndices = [];
      cfg.values.forEach((v, i) => { if (v === winAmount) matchingIndices.push(i); });
      
      // If none match perfectly (fallback backend mismatch), default to loss segment (which is index 4 typically)
      const targetIndex = matchingIndices.length > 0 
        ? matchingIndices[Math.floor(Math.random() * matchingIndices.length)] 
        : cfg.labels.findIndex(l => l === '0¢');

      // Math for stopping at targetIndex
      const sliceAngle = 360 / cfg.segments.length;
      const centerOfIndex = targetIndex * sliceAngle + (sliceAngle / 2);
      
      // We want the wheel to rotate such that the targetIndex sits at TOP (0 degrees).
      // If we stop at (360 - centerOfIndex), it puts that slice at exactly the top pointer.
      // E.g. index 1 (45-90deg, center 67.5). Rot = 360 - 67.5 = 292.5.
      
      const extraLoops = 4 * 360;
      // Add slight randomness within the slice bounds (+/- 10 degrees)
      const offset = (Math.random() * 20) - 10;
      const finalAngle = 360 - centerOfIndex + offset;
      
      const totalDeg = initRotation + extraLoops + finalAngle;
      
      setRotation(totalDeg);

      // Wait for CSS animation to finish (takes 3s)
      setTimeout(() => {
        setSpinning(false);
        const isWin = winAmount > 0;
        setResult({
          isWin,
          amt: cfg.labels[targetIndex],
          label: res.data.result.label
        });
        
        if (onBalanceUpdate && res.data.newBalance !== undefined) {
             onBalanceUpdate(res.data.newBalance);
        }
        
      }, 3000);

    } catch (err) {
      setSpinning(false);
      setRotation(initRotation); // keep the fake spin
      setResult({ isWin: false, amt: '0¢', label: 'Error/Insf. Balance' });
      toast.error(err.response?.data?.message || 'Transaction Failed');
    }
  };

  // SVG Renderer
  const cx = 110, cy = 110, r = 104;
  const sliceRad = (2 * Math.PI) / cfg.segments.length;

  return (
    <div className="w-full max-w-md mx-auto p-4 md:p-6 bg-slate-900 min-h-screen text-slate-200 font-sans">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center text-xl shadow-lg border border-orange-500/20">
          🎰
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight leading-tight">Luck Test</h1>
          <p className="text-xs text-slate-400">Spin & Win — Choose your risk</p>
        </div>
      </div>

      {/* Tier Tabs */}
      <div className="grid grid-cols-3 gap-2 mb-8">
        {['bronze', 'silver', 'gold'].map((t) => {
          const tCfg = TIERS[t];
          const isActive = tier === t;
          const emojis = { bronze: '🥉', silver: '🥈', gold: '🥇' };
          
          return (
            <button 
              key={t}
              onClick={() => handleTierSelect(t)}
              disabled={spinning}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${
                isActive ? tCfg.tabActiveBg : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
              } ${spinning ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className="text-2xl mb-1 drop-shadow-sm">{emojis[t]}</span>
              <span className={`text-[11px] font-bold uppercase tracking-wider ${isActive ? tCfg.tabActiveText : 'text-slate-300'}`}>
                {tCfg.name}
              </span>
              <span className={`text-[9px] font-mono mt-0.5 ${isActive ? 'opacity-80' : 'text-slate-500'}`}>
                {tCfg.cost}
              </span>
            </button>
          );
        })}
      </div>

      {/* Wheel Area */}
      <div className="flex flex-col items-center justify-center mb-8 relative">
        <div className="relative w-[220px] h-[220px]">
          {/* Pointer */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[12px] border-x-transparent border-t-[28px] border-t-white z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"></div>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-x-[10px] border-x-transparent border-t-[24px] border-t-slate-800 z-10"></div>
          
          {/* SVG Canvas */}
          <svg width="220" height="220" viewBox="0 0 220 220" className="w-full h-full drop-shadow-2xl">
            {/* Base Background */}
            <circle cx={cx} cy={cy} r={r} fill="#E0E0E0" opacity="0.1" />
            
            {/* Rotating Segment Group */}
            <g style={{ 
              transform: `rotate(${rotation}deg)`, 
              transformOrigin: '110px 110px',
              transition: spinning ? 'transform 3s cubic-bezier(0.17, 0.67, 0.22, 1)' : 'transform 0.5s ease-out'
            }}>
              {cfg.segments.map((color, i) => {
                const start = i * sliceRad - Math.PI / 2;
                const end = start + sliceRad;
                const x1 = cx + r * Math.cos(start);
                const y1 = cy + r * Math.sin(start);
                const x2 = cx + r * Math.cos(end);
                const y2 = cy + r * Math.sin(end);
                
                const mid = start + sliceRad / 2;
                const tx = cx + 64 * Math.cos(mid);
                const ty = cy + 64 * Math.sin(mid);

                return (
                  <g key={`seg-${i}`}>
                    <path d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`} fill={color} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                    <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="12" fontWeight="700" fontFamily="monospace" className="drop-shadow-md" transform={`rotate(${(mid * 180 / Math.PI) + 90}, ${tx}, ${ty})`}>
                      {cfg.labels[i]}
                    </text>
                  </g>
                );
              })}
            </g>
            
            {/* Static Center Hub */}
            <circle cx={cx} cy={cy} r="24" fill="#1E293B" stroke="rgba(255,255,255,0.2)" strokeWidth="3" className="shadow-2xl"/>
            <text x={cx} y={cy+3} textAnchor="middle" dominantBaseline="middle" fill="#94A3B8" fontSize="10" fontWeight="900" style={{ letterSpacing: '1px' }}>SPIN</text>
          </svg>
        </div>

        {/* Spin action */}
        <button 
          onClick={doSpin}
          disabled={spinning}
          className={`mt-8 px-12 py-3.5 rounded-full font-bold text-sm tracking-widest uppercase transition-all shadow-xl disabled:opacity-75 disabled:scale-95 active:scale-95 bg-gradient-to-br ${cfg.btnClass} ${cfg.textClass}`}
        >
          {spinning ? 'Spinning...' : 'SPIN NOW'}
        </button>
        <p className="mt-3 text-[11px] text-slate-500 font-mono tracking-tight bg-slate-800/50 px-3 py-1 rounded-full">{cfg.costLabel}</p>
      </div>

      {/* Result Banner */}
      {result && (
        <div className={`mb-6 p-4 rounded-xl border text-center animate-in fade-in slide-in-from-bottom-2 ${result.isWin ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800 border-slate-700'}`}>
          <div className={`text-2xl font-black font-mono tracking-tighter ${result.isWin ? 'text-emerald-400' : 'text-slate-400'}`}>
            {result.isWin ? `+${result.amt}` : result.label.toUpperCase()}
          </div>
          <p className={`text-xs mt-1 ${result.isWin ? 'text-emerald-500/80' : 'text-slate-500'}`}>
            {result.isWin ? 'Balance immediately updated!' : 'Better luck next time!'}
          </p>
        </div>
      )}

      {/* Prize Info */}
      <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 mb-6 shadow-inner">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-3">{cfg.prizesTitle}</h3>
        <div className="space-y-2">
          {cfg.prizes.map((p, i) => (
            <div key={i} className="flex items-center justify-between text-xs pb-2 border-b border-slate-700/50 last:border-0 last:pb-0">
              <span className="text-slate-200 font-medium">{p.label}</span>
              <div className="flex items-center gap-4">
                <span className="text-slate-500 font-mono text-[11px]">{p.chance}</span>
                <span className={`font-mono font-bold w-6 text-right ${p.cls}`}>{p.amt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
          <p className="text-[10px] text-slate-500 tracking-wider uppercase mb-1">Win Rate</p>
          <p className="text-lg font-mono font-bold text-slate-300">{cfg.rtp}</p>
        </div>
        <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
          <p className="text-[10px] text-slate-500 tracking-wider uppercase mb-1">Top Jackpot</p>
          <p className="text-lg font-mono font-bold text-emerald-400">{cfg.jackpot}</p>
        </div>
      </div>

    </div>
  );
}
