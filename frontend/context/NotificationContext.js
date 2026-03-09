'use client';
import { createContext, useContext, useState, useEffect } from 'react';

import { useSocket } from '../hooks/useSocket';
import api from '../services/api';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

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
        const playSound = () => {
            const now = Date.now();
            if (now - lastSoundTime < 500) return; // Cooldown of 500ms
            lastSoundTime = now;

            try {
                const audio = new Audio('/sounds/notification.mp3');
                audio.play().catch(e => console.warn("Audio autoplay blocked", e));
            } catch (e) { }
        };

        // 2. Generic Notification
        socket.on('notification', (newNotif) => {
            playSound();
            const style = newNotif.type === 'error' ? errorStyle : premiumStyle;
            toast(newNotif.message, { style });
        });

        // 2. Wallet Update (Real-time Balance)
        const handleWalletUpdate = (data) => {
            console.log('[SOCKET_CONTEXT] Wallet Update Received');
            playSound();

            // If it's a legacy or structured withdrawal/deposit event
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
                // Silent refresh for P2P and others
                console.log('[SOCKET_CONTEXT] Triggering Silent Balance Refresh');
            }

            // Trigger Context Refresh (Refreshes the global useAuth state)
            if (refreshUser) refreshUser();
        };

        socket.on('wallet:update', handleWalletUpdate);


        // 3. System Config Update (RTP / Maintenance)
        socket.on('config:update', (data) => {
            console.log('Admin Config Update:', data);
            toast(`System Update: ${data.key} refreshed`, {
                icon: '⚙️',
                style: { ...premiumStyle, border: '1px solid #3b82f6' }
            });
        });

        return () => {
            socket.off('connect');
            socket.off('notification');
            socket.off('wallet:update', handleWalletUpdate);
            socket.off('balance_update', handleWalletUpdate);
            socket.off('config:update');
        };
    }, [socket]); // [FIX] Removed refreshUser from dependency array to prevent infinite loop

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
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    return useContext(NotificationContext);
}
