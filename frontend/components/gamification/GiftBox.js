'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, Shield, Timer, Coins } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import useGameSound from '../../hooks/useGameSound';
import { socket } from '../../services/socket';

// ─── Constants ───────────────────────────────────────────────────────────────
const ANIMATION_DURATION_MS = 1500; // Flying Numbers duration
const LOCK_DELAY_MS         = 300;  // Pause before Golden Lock appears
const BALANCE_SYNC_DELAY_MS = 100;  // Sync balance 100ms after animation ends

// Helper to get random integer between min and max
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const TIERS = [
  { id: 'free',   name: 'Free Daily',  cost: 0,  icon: '🎁', desc: 'Once every 24h',   maxLabel: 'Random' },
  { id: 'bronze', name: 'Bronze Box',  cost: 3,  icon: '📦', desc: 'Up to 5 NXS',      maxLabel: '3 NXS'  },
  { id: 'silver', name: 'Silver Box',  cost: 6,  icon: '💎', desc: 'Up to 25 NXS',     maxLabel: '15 NXS' },
  { id: 'gold',   name: 'Gold Box',    cost: 9, icon: '👑', desc: 'Up to 18 NXS',     maxLabel: '10 NXS' },
];

// ─── Confetti Helper ──────────────────────────────────────────────────────────
async function fireConfetti(type = 'normal') {
  if (typeof window === 'undefined') return;
  const confetti = (await import('canvas-confetti')).default;

  if (type === 'jackpot') {
    // Golden rain for jackpot wins
    const end = Date.now() + 2500;
    const frame = () => {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FFD700', '#FFA500', '#FFEC8B', '#DAA520'],
      });
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FFD700', '#FFA500', '#FFEC8B', '#DAA520'],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  } else {
    // Colorful confetti for regular 1.5x wins
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.55 },
      colors: ['#a786ff', '#fd8bbc', '#eca184', '#f8deb1', '#00d9ff'],
    });
  }
}

// ─── Flying Number Particle ───────────────────────────────────────────────────
function FlyingNumber({ value, delay, x, size }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, x, scale: 0.6 }}
      animate={{ opacity: [0, 1, 1, 0], y: -180, scale: [0.6, size, size, 0.4] }}
      transition={{ duration: ANIMATION_DURATION_MS / 1000, delay, ease: 'easeOut' }}
      className="absolute bottom-0 left-1/2 select-none pointer-events-none font-black"
      style={{
        fontSize: `${size * 1.4}rem`,
        color: `hsl(${(value * 7) % 360}, 80%, 70%)`,
        textShadow: `0 0 20px hsl(${(value * 7) % 360}, 80%, 70%)`,
        transform: `translateX(calc(-50% + ${x}px))`,
      }}
    >
      {value}
    </motion.div>
  );
}

// ─── Golden Lock Display ──────────────────────────────────────────────────────
function GoldenLock({ amount, isJackpot }) {
  return (
    <motion.div
      initial={{ scale: 0.2, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
      className="flex flex-col items-center gap-3"
    >
      {/* Golden Glow Ring */}
      <div className="relative flex items-center justify-center">
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-70"
          style={{ background: isJackpot ? 'radial-gradient(circle, #FFD700, #FF6B00)' : 'radial-gradient(circle, #FFD700, #B8860B)' }}
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="absolute w-36 h-36 rounded-full border-2 border-dashed border-yellow-400/30"
        />
        <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 flex items-center justify-center shadow-2xl border-4 border-yellow-200/50">
          <Coins size={44} className="text-yellow-900 drop-shadow-lg" />
        </div>
      </div>

      {/* Amount */}
      <div className="text-center">
        <motion.div
          animate={isJackpot ? { scale: [1, 1.1, 1], textShadow: ['0 0 10px #FFD700', '0 0 40px #FFD700', '0 0 10px #FFD700'] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-5xl font-black"
          style={{ color: '#FFD700', textShadow: '0 0 20px #FFD700, 0 0 40px #FF8C00' }}
        >
          +{amount}
        </motion.div>
        <div className="text-yellow-400/60 text-xs font-bold tracking-widest uppercase mt-1">NXS</div>
        {isJackpot && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-2 px-4 py-1 bg-yellow-400/20 border border-yellow-400/40 rounded-full text-yellow-300 text-[10px] font-black uppercase tracking-widest"
          >
            ✨ Jackpot Win ✨
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function GiftBox({ onBalanceUpdate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [phase, setPhase] = useState('select'); // 'select' | 'flying' | 'lock' | 'result'
  const [selectedTier, setSelectedTier] = useState(null);
  const [apiResult, setApiResult] = useState(null);
  const [maxSafeWin, setMaxSafeWin] = useState(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [engineMode, setEngineMode] = useState('single');
  const [isShaking, setIsShaking] = useState(false);
  const { play: playSound } = useGameSound();
  const baselineBalanceRef = useRef(null);

  const fetchVaultStatus = async () => {
    try {
      const res = await api.get('/game/vault-status');
      if (res.data.success) {
        setMaxSafeWin(res.data.maxSafeWin);
      }
    } catch (e) {
      console.error("[GIFT_BOX_VAULT_ERROR]", e);
    }
  };

  useEffect(() => {
    setHasMounted(true);
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener('toggle-mystery-box', handleToggle);
    return () => window.removeEventListener('toggle-mystery-box', handleToggle);
  }, []);

  useEffect(() => {
    if (isOpen) {
        fetchVaultStatus();
        if (socket && typeof window !== 'undefined') {
            socket.on('engine_state', (data) => {
                if (data.gameType === 'gift' || data.gameType === 'global') {
                    setEngineMode(data.mode);
                }
            });
            socket.emit('start_game', 'gift');
        }
    } else {
        if (socket && typeof window !== 'undefined') {
            socket.off('engine_state');
            socket.emit('leave_game', 'gift');
        }
    }
  }, [isOpen]);

  const handleOpenBox = async (tier) => {
    if (phase !== 'select') return;

    // ── [SOCKET GUARD] Lock balance updates during animation ──
    if (typeof window !== 'undefined') {
      window.isMysteryVaultAnimating = true;
      window.unifiedDeferredBalance = null;
    }

    setSelectedTier(tier);
    setSelectedTier(tier.id);
    baselineBalanceRef.current = user?.wallet?.main || 0;
    
    // [PRO ANIMATION] 150ms Shake Feedback before any server call
    setIsShaking(true);
    playSound('click-v2'); 

    setTimeout(async () => {
      setIsShaking(false);
      setPhase('flying');
      playSound('notification');
      setTimeout(() => playSound('tick'), 200);

      // ── Fetch backend result in parallel with animation ──
      let result = null;
      try {
        const res = await api.post('/game/open-gift', { tier: tier.id });
        if (res.data.success) result = res.data;
      } catch (err) {
        // Rollback
        setPhase('select');
        setSelectedTier(null);
        if (typeof window !== 'undefined') window.isMysteryVaultAnimating = false;
        toast.error(err.response?.data?.message || 'Failed to open box');
        return;
      }

      // ── Wait for Flying Numbers animation to finish ──
      await new Promise(r => setTimeout(r, ANIMATION_DURATION_MS + LOCK_DELAY_MS));

      setApiResult(result);
      setPhase('lock');

      // ── Determine win type ──
      const cost = tier.cost || 1;
      const winAmt = result?.reward?.amountNXS || 0;
      const isJackpot = winAmt >= cost * 1.5;

      // ── Fire Confetti & Play Sound ──
      if (winAmt > 0) {
        playSound(isJackpot ? 'win' : 'success');
        fireConfetti(isJackpot ? 'jackpot' : 'normal');
      } else {
        playSound('loss');
      }

      // ── [BALANCE SYNC] Unlock socket and sync balance 100ms after animation ──
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.isMysteryVaultAnimating = false;

          const finalBalance = result?.newBalance;
          if (finalBalance !== undefined) {
            window.dispatchEvent(new CustomEvent('balance_update', { detail: finalBalance }));
          }

          // Flush any deferred socket update
          if (window.unifiedDeferredBalance !== null && window.unifiedDeferredBalance !== undefined) {
            window.dispatchEvent(new CustomEvent('balance_update', { detail: window.unifiedDeferredBalance }));
            window.unifiedDeferredBalance = null;
          }
        }

        if (typeof onBalanceUpdate === 'function') onBalanceUpdate();
      }, BALANCE_SYNC_DELAY_MS);
    }, 150);
  };

  const closeAll = () => {
    if (phase === 'flying') return; // Block close during animation
    setIsOpen(false);
    setPhase('select');
    setSelectedTier(null);
    setApiResult(null);
    if (typeof window !== 'undefined') {
      window.isMysteryVaultAnimating = false;
    }
  };

  // Dynamic flying particles generation - rebuilt every time the phase turns to 'flying'
  const particles = useMemo(() => {
    if (phase !== 'flying') return [];
    return Array.from({ length: 15 }).map((_, i) => ({
      value: getRandomInt(5, 500),
      delay: (i * 0.15),
      x: getRandomInt(-120, 120),
      size: 0.7 + Math.random() * 1.2,
    }));
  }, [phase]);

  if (!hasMounted) return null;

  const winAmt = apiResult?.reward?.amountNXS || 0;
  const cost = TIERS.find(t => t.id === selectedTier)?.cost || 1;
  const isJackpot = winAmt >= cost * 1.5;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAll}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative w-full max-w-[360px] bg-[#0f172a] rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={closeAll}
              disabled={phase === 'flying'}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-white z-20 disabled:opacity-30"
            >
              <X size={18} />
            </button>

            <div className="p-8">

              {/* ── PHASE: SELECT ─────────────────────────────────── */}
              {phase === 'select' && (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="space-y-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
                            Mystery Vault
                            {/* P2P Indicator Bati */}
                            <div className={`w-2 h-2 rounded-full shadow-[0_0_8px] transition-all duration-500 ${engineMode === 'p2p' ? 'bg-green-500 shadow-green-500 animate-pulse' : 'bg-slate-600 shadow-transparent'}`}></div>
                        </h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Select your prize tier</p>
                    </div>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-4 px-2 no-scrollbar scroll-smooth">
                    {TIERS.map((t, idx) => (
                      <motion.button
                        key={t.id}
                        onClick={() => handleOpenBox(t)}
                        className={`flex-shrink-0 w-32 aspect-[3/4] p-4 rounded-3xl bg-slate-800/60 border border-white/5 relative overflow-hidden group transition-all duration-300 ${isShaking && selectedTier === t.id ? 'animate-shake' : 'hover:scale-105 hover:bg-white/10 hover:border-yellow-500/30'} ${selectedTier === t.id ? 'border-yellow-500 shadow-xl' : ''}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        {/* Card Glow Background */}
                        <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br from-yellow-400 to-transparent`} />
                        
                        <div className="h-full flex flex-col items-center justify-between relative z-10">
                          <span className="text-4xl mt-2 drop-shadow-lg scale-110 group-hover:scale-125 transition-transform duration-500">{t.icon}</span>
                          
                          <div className="text-center w-full">
                            <div className="text-white font-black text-[10px] uppercase tracking-tighter truncate mb-1">{t.name}</div>
                            <div className={`text-[8px] font-black px-1.5 py-0.5 rounded-md inline-block ${t.cost === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`}>
                              {t.cost === 0 ? 'FREE' : `${t.cost} NXS`}
                            </div>
                            <div className="text-slate-500 text-[8px] mt-1 line-clamp-1">{t.maxLabel}</div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── PHASE: FLYING NUMBERS ─────────────────────────── */}
              {phase === 'flying' && (
                <motion.div
                  key="flying"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-4"
                  style={{ minHeight: 260 }}
                >
                  {/* Title */}
                  <motion.p
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.4em] mb-6"
                  >
                    Opening Vault...
                  </motion.p>

                  {/* Box + Particles container */}
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    {/* Flying Particles */}
                    {particles.map((p, i) => (
                      <FlyingNumber key={i} {...p} />
                    ))}

                    {/* The Vault Box */}
                    <motion.div
                      animate={{
                        rotate: [-3, 3, -3, 3, 0],
                        scale: [1, 1.06, 1, 1.06, 1],
                        boxShadow: ['0 0 20px #FF6B0060', '0 0 50px #FFD70080', '0 0 20px #FF6B0060'],
                      }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="w-28 h-28 bg-gradient-to-br from-rose-500 to-pink-700 rounded-3xl flex items-center justify-center border-4 border-white/10 z-10"
                    >
                      <Gift size={50} className="text-white" />
                    </motion.div>
                  </div>

                  {/* Neon Glimmer bottom bar */}
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="mt-6 h-0.5 w-2/3 rounded-full"
                    style={{ background: 'linear-gradient(to right, transparent, #FFD700, #FF6B00, #FFD700, transparent)' }}
                  />
                </motion.div>
              )}

              {/* ── PHASE: GOLDEN LOCK ────────────────────────────── */}
              {phase === 'lock' && apiResult && (
                <motion.div
                  key="lock"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-4 gap-6"
                  style={{ minHeight: 260 }}
                >
                  <GoldenLock amount={winAmt} isJackpot={isJackpot} />

                  {/* Collect Button */}
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    onClick={closeAll}
                    className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all shadow-lg"
                    style={{
                      background: isJackpot
                        ? 'linear-gradient(135deg, #B8860B, #FFD700, #B8860B)'
                        : 'linear-gradient(135deg, #059669, #10b981)',
                      color: isJackpot ? '#1a0e00' : 'white',
                      boxShadow: isJackpot ? '0 0 20px #FFD70060' : '0 0 20px #10b98160',
                    }}
                  >
                    {isJackpot ? '🏆 Collect Jackpot' : '✅ Collect & Close'}
                  </motion.button>
                </motion.div>
              )}

            </div>

            {/* Trust Footer */}
            <div className="bg-white/5 p-4 flex items-center justify-center gap-6 border-t border-white/5 opacity-40">
              <div className="flex items-center gap-1.5">
                <Shield size={12} className="text-emerald-400" />
                <span className="text-[8px] font-bold text-white uppercase tracking-widest">Secure RNG</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Timer size={12} className="text-blue-400" />
                <span className="text-[8px] font-bold text-white uppercase tracking-widest">Provably Fair</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
