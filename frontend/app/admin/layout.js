'use client';
import { useEffect, useRef } from 'react';
import AdminBottomNav from '../../components/AdminBottomNav';
import AdminSidebar from '../../components/admin/AdminSidebar';
import toast from 'react-hot-toast';

export default function AdminLayout({ children }) {
    const audioRef = useRef(null);

    useEffect(() => {
        // [NEW] Global Real-time Admin Notifications via Socket
        const getSocket = require('../../services/socket').default;
        const socket = getSocket();
        
        // Initialize Audio object for notifications
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio('/sounds/notification.mp3'); // Create this file or it will gracefully fail
        }

        if (socket) {
            socket.emit('join_room', 'admin_dashboard');
            
            socket.on('new_transaction_request', (data) => {
                // Play notification sound
                if (audioRef.current) {
                    audioRef.current.play().catch(e => console.log('Audio play prevented by browser', e));
                }

                toast.success(data.message || `New ${data.type} request received!`, {
                    icon: data.type === 'deposit' ? '💳' : '💰',
                    style: { background: '#064E3B', color: '#fff', fontWeight: 'bold' }
                });
            });
        }

        return () => { 
            if (socket) {
                socket.off('new_transaction_request');
            }
        };
    }, []);

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
                    {/* Background Noise/Gradient Shared */}
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
