'use client';
import { createContext, useContext, useState, useEffect } from 'react';

import { useSocket } from '../hooks/useSocket';
import api from '../services/api';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

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
                }
            } catch (e) {
                // Squelch 401s here as they are expected during token expiry
            }
        };

        joinRoom();

        // 1. Generic Notification
        socket.on('notification', (newNotif) => {
            const style = newNotif.type === 'error' ? errorStyle : premiumStyle;
            toast(newNotif.message, { style });
        });

        // 2. Wallet Update (Real-time Balance)
        socket.on('wallet:update', (data) => {
            // Show Premium Toast
            if (data.type === 'withdrawal_completed') {
                toast.success(`Withdrawal Approved: ৳${data.amount}`, {
                    style: { ...premiumStyle, background: 'linear-gradient(135deg, #064e3b, #065f46)' },
                    icon: '💸'
                });
            } else if (data.type === 'deposit_received') {
                toast.success(`Deposit Received: ৳${data.amount}`, {
                    style: { ...premiumStyle, background: 'linear-gradient(135deg, #1e3a8a, #172554)' },
                    icon: '💎'
                });
            }

            // Trigger Context Refund
            if (refreshUser) refreshUser();
        });

        // 3. System Config Update (RTP / Maintenance)
        socket.on('config:update', (data) => {
            console.log('Admin Config Update:', data);
            toast(`System Update: ${data.key} refreshed`, {
                icon: '⚙️',
                style: { ...premiumStyle, border: '1px solid #3b82f6' }
            });
        });

        return () => {
            socket.off('notification');
            socket.off('wallet:update');
            socket.off('config:update');
        };
    }, [socket, refreshUser]);

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
