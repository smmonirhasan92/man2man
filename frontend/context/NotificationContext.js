'use client';
import { createContext, useContext, useState, useEffect } from 'react';

import { useSocket } from '../hooks/useSocket';
import api from '../services/api';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
    const [socket, setSocket] = useState(null);
    const { refreshUser } = useAuth(); // Hook to refresh balance on update
    const systemSocket = useSocket('/system'); // Use the singleton hook
    const router = useRouter();

    // Persistent Audio Refs to bypass Browser Autoplay rules 
    const isClient = typeof window !== 'undefined';

    // Initialize Socket
    useEffect(() => {
        if (systemSocket) {
            setSocket(systemSocket);
        }
    }, [systemSocket]);

    // Listen for Real-time Events
    useEffect(() => {
        if (!socket) return;

        const joinRoom = async () => {
            const token = localStorage.getItem('token');
            if (!token) return; // Don't try to join room if not logged in

            try {
                const res = await api.get('/auth/me');
                if (res.data && res.data._id) {
                    socket.emit('join_user_room', res.data._id);
                    console.log(`[SOCKET_CONTEXT] Joined room: user_${res.data._id}`);
                }
            } catch (e) {
                // Squelch 401s here as they are expected during token expiry
            }
        };

        const setupWebPush = async () => {
            if ('serviceWorker' in navigator && 'PushManager' in window && localStorage.getItem('token')) {
                try {
                    const registration = await navigator.serviceWorker.register('/sw.js');
                    const permission = await Notification.requestPermission();

                    if (permission === 'granted') {
                        let subscription = await registration.pushManager.getSubscription();
                        if (!subscription) {
                            const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                            if (key) {
                                subscription = await registration.pushManager.subscribe({
                                    userVisibleOnly: true,
                                    applicationServerKey: urlBase64ToUint8Array(key)
                                });
                            }
                        }

                        if (subscription) {
                            await api.post('/notifications/subscribe', subscription);
                        }
                    }
                } catch (error) {
                    console.error('Service Worker / Push Error', error);
                }
            }
        };

        // 1. Initial Join
        joinRoom();
        setupWebPush();

        // 1.5. Re-join on Reconnect (Fixes mobile sleep disconnects)
        socket.on('connect', () => {
            console.log('[SOCKET_CONTEXT] Reconnected - rejoining rooms...');
            joinRoom();
        });

        let lastSoundTime = 0;
        const playSound = (type = 'info') => {
            if (!isClient) return;
            const now = Date.now();
            if (now - lastSoundTime < 800) return; // Cooldown
            lastSoundTime = now;

            try {
                let audioNode = document.getElementById('global-audio-info');
                if (type === 'success') audioNode = document.getElementById('global-audio-success');
                if (type === 'error') audioNode = document.getElementById('global-audio-error');
                if (type === 'chat') audioNode = document.getElementById('global-audio-chat');

                if (audioNode) {
                    audioNode.currentTime = 0;
                    const playPromise = audioNode.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(e => console.warn("Audio autoplay blocked by OS:", e));
                    }
                }
            } catch (e) { }
        };

        const handleNotification = (newNotif) => {
            // [BACKGROUND SYNC] Prevent Double Notifications when active inside chat
            if (newNotif.type === 'chat') {
                const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
                const activeTradeId = searchParams?.get('tradeId');
                const isChatPage = window.location.pathname.includes('/p2p') && activeTradeId === newNotif.metadata?.tradeId;
                if (isChatPage) return; // Prevent double alerts if staring right at it
            }

            playSound(newNotif.type);
            const style = newNotif.type === 'error' ? errorStyle : premiumStyle;
            
            if (newNotif.url) {
                toast((t) => (
                    <div 
                        className="cursor-pointer" 
                        onClick={() => {
                            toast.dismiss(t.id);
                            router.push(newNotif.url);
                        }}
                    >
                        {newNotif.title && <div className="text-[12.5px] font-black text-[#eaeaec] drop-shadow-md pb-0.5 border-b border-[#2b3139] mb-1 leading-none tracking-wide">{newNotif.title}</div>}
                        <div className="text-[11px] mt-1">{newNotif.message}</div>
                        <div className="text-[9px] text-blue-400 mt-1.5 font-bold uppercase">Tap to view ➔</div>
                    </div>
                ), { style, duration: 8000 });
            } else {
                toast(newNotif.message, { style });
            }
        };

        const handleWalletUpdate = (data) => {
            console.log('[SOCKET_CONTEXT] Wallet Update Received');

            // [P#3] SOCKET SPOILER GUARD
            // If a high-stakes animation is running, do NOT update the UI yet.
            // This prevents the user from seeing their new balance before the animation finishes.
            if (typeof window !== 'undefined') {
                if (window.isLuckTestAnimating || window.isMysteryVaultAnimating) {
                    console.log('[SOCKET_CONTEXT] Animation in progress. Deferring UI update.');
                    window.deferredLuckTestBalance = data?.newBalance || data?.amount || data;
                    window.deferredVaultBalance = data?.newBalance || data?.amount || data;
                    return; 
                }
            }

            playSound('success');

            if (data?.type === 'withdrawal_completed') {
                toast.success(`Withdrawal Approved: $${data.amount}`, {
                    style: { ...premiumStyle, background: 'linear-gradient(135deg, #064e3b, #065f46)' },
                    icon: '💸'
                });
            } else if (data?.type === 'deposit_received') {
                toast.success(`Deposit Received: $${data.amount}`, {
                    style: { ...premiumStyle, background: 'linear-gradient(135deg, #1e3a8a, #172554)' },
                    icon: '💎'
                });
            } else {
                console.log('[SOCKET_CONTEXT] Triggering Silent Balance Refresh');
            }

            if (refreshUser) refreshUser();
        };

        const handleConfigUpdate = (data) => {
            console.log('Admin Config Update:', data);
            toast(`System Update: ${data.key} refreshed`, {
                icon: '⚙️',
                style: { ...premiumStyle, border: '1px solid #3b82f6' }
            });
        };

        socket.on('notification', handleNotification);
        socket.on('wallet:update', handleWalletUpdate);
        socket.on('balance_update', handleWalletUpdate); // [SYNC] Handle numeric balance updates
        socket.on('config:update', handleConfigUpdate);

        return () => {
            socket.off('connect');
            socket.off('notification', handleNotification);
            socket.off('wallet:update', handleWalletUpdate);
            socket.off('balance_update', handleWalletUpdate);
            socket.off('config:update', handleConfigUpdate);
        };
    }, [socket]); // [FIX] Removed refreshUser from dependency array to prevent infinite loop
    
    // [FIX] Hydration Mismatch Safeguard
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    // Custom Styles for Premium Feel
    const premiumStyle = {
        background: 'rgba(15, 23, 42, 0.9)',
        color: '#FFD700',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 215, 0, 0.3)',
        borderRadius: '12px',
        padding: '16px',
        fontWeight: 'bold',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
    };

    const errorStyle = {
        background: 'rgba(69, 10, 10, 0.9)',
        color: '#fca5a5',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(248, 113, 113, 0.3)',
        borderRadius: '12px',
        padding: '16px'
    };

    const showError = (message) => toast.error(message, { style: errorStyle });
    const showSuccess = (message) => toast.success(message, { style: premiumStyle });

    return (
        <NotificationContext.Provider value={{ showError, showSuccess }}>
            {children}
            
            {/* [FIX] ALL CLIENT-ONLY UI ELEMENTS IN ONE CONDITION TO PREVENT HYDRATION MISMATCH */}
            {mounted && (
                <>
                    {/* Global Toaster with Premium Config */}
                    <Toaster
                        position="top-center"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: '#333',
                                color: '#fff',
                            },
                        }}
                    />

                    {/* INVISIBLE GLOBAL AUDIO ELEMENTS TO PREVENT AUTOPLAY STUTTERS */}
                    <audio id="global-audio-info" preload="auto">
                        <source src="/sounds/notification-v2.mp3" type="audio/mpeg" />
                    </audio>
                    <audio id="global-audio-success" preload="auto">
                        <source src="/sounds/success-v2.mp3" type="audio/mpeg" />
                    </audio>
                    <audio id="global-audio-error" preload="auto">
                        <source src="/sounds/error-v2.mp3" type="audio/mpeg" />
                    </audio>
                    <audio id="global-audio-chat" preload="auto">
                        <source src="/sounds/tick-v2.mp3" type="audio/mpeg" />
                    </audio>
                </>
            )}
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    return useContext(NotificationContext);
}
