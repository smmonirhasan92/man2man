'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';

export default function NotificationPopup() {
    const [notifications, setNotifications] = useState([]);
    const socket = useSocket('/system');

    useEffect(() => {
        if (!socket) return;

        const handleNotification = (data) => {
            // data: { _id, message, type, createdAt }
            const id = data._id || Date.now();
            setNotifications((prev) => [...prev, { ...data, id }]);

            // Auto-dismiss after 5 seconds
            setTimeout(() => {
                removeNotification(id);
            }, 5000);

            // Play Sound? (Optional)
        };

        socket.on('notification', handleNotification);

        return () => {
            socket.off('notification', handleNotification);
        };
    }, [socket]);

    const removeNotification = (id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-400" />;
            case 'error': return <AlertTriangle className="w-5 h-5 text-red-400" />;
            default: return <Info className="w-5 h-5 text-blue-400" />;
        }
    };

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
            <AnimatePresence mode="popLayout">
                {notifications.map((notif) => (
                    <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                        layout
                        className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl flex items-start gap-3 relative overflow-hidden group"
                    >
                        {/* Glow Effect */}
                        <div className={`absolute inset-0 bg-gradient-to-r opacity-10 pointer-events-none
                            ${notif.type === 'success' ? 'from-emerald-500 to-transparent' :
                                notif.type === 'error' ? 'from-red-500 to-transparent' :
                                    'from-blue-500 to-transparent'}`}
                        />

                        <div className="shrink-0 mt-0.5">
                            {getIcon(notif.type)}
                        </div>

                        <div className="flex-1">
                            <h4 className={`text-xs font-bold uppercase tracking-wider mb-0.5
                                ${notif.type === 'success' ? 'text-emerald-400' :
                                    notif.type === 'error' ? 'text-red-400' :
                                        'text-slate-400'}`}
                            >
                                {notif.type || 'System'}
                            </h4>
                            <p className="text-sm text-slate-200 font-medium leading-tight">
                                {notif.message}
                            </p>
                        </div>

                        <button
                            onClick={() => removeNotification(notif.id)}
                            className="text-slate-500 hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
