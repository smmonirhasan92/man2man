'use client';
import { useEffect, useRef, useCallback } from 'react';
import AdminBottomNav from '../../components/AdminBottomNav';
import AdminSidebar from '../../components/admin/AdminSidebar';
import toast from 'react-hot-toast';

// Sound generator using Web Audio API (no file needed — works on mobile too)
function playBeep(type = 'deposit') {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        
        const playTone = (freq, start, duration, vol = 0.5) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type === 'withdraw' ? 'square' : 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
            gain.gain.setValueAtTime(vol, ctx.currentTime + start);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + start);
            osc.stop(ctx.currentTime + start + duration);
        };

        if (type === 'deposit') {
            // Triple ascending ding (very noticeable)
            playTone(523.25, 0, 0.4);   // C5
            playTone(659.25, 0.1, 0.4); // E5
            playTone(784.00, 0.2, 0.4); // G5
        } else if (type === 'withdraw') {
            // Urgent double siren (hard to miss)
            playTone(880, 0, 0.3, 0.6);
            playTone(440, 0.15, 0.3, 0.6);
            playTone(880, 0.3, 0.3, 0.6);
        } else {
            playTone(660, 0, 0.3);
        }
    } catch (e) {
        console.warn('[Admin Sound] Web Audio API failed:', e.message);
    }
}

// Browser Push Notification
function pushNotify(title, body, icon = '💰') {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
        new Notification(title, {
            body,
            icon: '/logo.png',
            badge: '/logo.png',
            tag: 'admin-alert-' + Date.now(),
            requireInteraction: false,
            silent: false,
        });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(perm => {
            if (perm === 'granted') pushNotify(title, body, icon);
        });
    }
}

export default function AdminLayout({ children }) {
    const audioRef = useRef(null);
    const userInteracted = useRef(false);

    // Track first user interaction (required for audio on mobile)
    const handleInteraction = useCallback(() => {
        userInteracted.current = true;
        // Pre-warm Audio context
        try { new (window.AudioContext || window.webkitAudioContext)(); } catch(e){}
    }, []);

    useEffect(() => {
        // Request notification permission on load
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }

        // Track interaction for mobile audio unlock
        window.addEventListener('click', handleInteraction, { once: true });
        window.addEventListener('touchstart', handleInteraction, { once: true });

        // Fallback mp3 audio (if exists)
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio('/sounds/notification-v2.mp3');
            audioRef.current.preload = 'auto';
        }

        const getSocket = require('../../services/socket').default;
        const socket = getSocket();

        if (socket) {
            socket.emit('join_admin_room', 'adminToken');

            // ── DEPOSIT EVENT ──
            socket.on('new_deposit_request', (data) => {
                const amount = data.amount || 0;
                const user = data.username || data.userId || 'User';
                
                playBeep('deposit');
                pushNotify(
                    '💳 New Deposit!',
                    `${user} deposited ${amount} NXS (Process within 1-2 hours)`
                );

                toast.success(
                    `💳 New Deposit: ${amount} NXS\n${user}\n(Process within 1-2 hours)`,
                    {
                        duration: 8000,
                        style: {
                            background: 'linear-gradient(135deg, #064E3B, #065F46)',
                            color: '#fff',
                            fontWeight: 'bold',
                            border: '1px solid #10b981',
                            borderRadius: '12px',
                            fontSize: '14px',
                            padding: '16px',
                            boxShadow: '0 0 20px rgba(16,185,129,0.4)',
                            minWidth: '280px',
                        },
                    }
                );
            });

            // ── WITHDRAWAL EVENT ──
            socket.on('new_transaction_request', (data) => {
                const isWithdraw = data.type === 'withdraw' || data.type === 'cash_out';
                const isDeposit = data.type === 'deposit';
                
                playBeep(isWithdraw ? 'withdraw' : isDeposit ? 'deposit' : 'alert');

                const emoji = isWithdraw ? '💸' : isDeposit ? '💳' : '🔔';
                const color = isWithdraw ? '#7f1d1d' : '#064E3B';
                const border = isWithdraw ? '#ef4444' : '#10b981';
                const glow = isWithdraw ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)';
                const label = isWithdraw ? 'Withdrawal Request' : isDeposit ? 'New Deposit' : 'New Transaction';
                const amount = data.amount || '';

                pushNotify(
                    `${emoji} ${label}`,
                    `${amount ? amount + ' NXS — ' : ''}${data.message || 'Action required in admin panel'}`
                );

                toast(
                    (t) => (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '24px' }}>{emoji}</span>
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{label}</div>
                                <div style={{ fontSize: '12px', opacity: 0.85 }}>{data.message || `${amount} NXS`}</div>
                            </div>
                        </div>
                    ),
                    {
                        duration: 10000,
                        style: {
                            background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                            color: '#fff',
                            border: `1px solid ${border}`,
                            borderRadius: '12px',
                            padding: '14px 18px',
                            boxShadow: `0 0 25px ${glow}`,
                            minWidth: '300px',
                        },
                    }
                );
            });

            // Ensure joined if already connected
            if (socket.connected) socket.emit('join_admin_room', 'adminToken');
        }

        return () => {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
            if (socket) {
                socket.off('new_transaction_request');
                socket.off('new_deposit_request');
            }
        };
    }, [handleInteraction]);

    return (
        <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans">
            {/* Desktop Sidebar */}
            <AdminSidebar />

            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Mobile Header */}
                <header className="lg:hidden bg-[#0D0D0D] p-4 border-b border-white/10 sticky top-0 z-40 flex justify-between items-center">
                    <h1 className="text-lg font-bold tracking-tight">Admin Console</h1>
                    <div className="text-xs bg-pink-600/20 text-pink-400 px-3 py-1 rounded-full border border-pink-500/30">v3.1 VPS-DOCKER SYNC</div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto custom-scrollbar p-0 relative">
                    <div className="fixed inset-0 pointer-events-none opacity-10"></div>
                    {children}
                </main>

                {/* Mobile Bottom Nav */}
                <div className="lg:hidden">
                    <AdminBottomNav />
                </div>
            </div>
        </div>
    );
}
