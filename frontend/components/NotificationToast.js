'use client';
import { useEffect, useState } from 'react';
import { CheckCircle, Info, AlertTriangle, XCircle, X } from 'lucide-react';

// If useSocket doesn't exist, we will create it or use direct connection here.
// But context/NotificationContext might handle this. Let's see what the view_file reveals.
// For now, I'll write a standalone Toast that hooks into window/event or context.

export default function NotificationToast({ notifications, removeNotification }) {
    if (!notifications || notifications.length === 0) return null;

    return (
        <div className="fixed top-5 right-5 z-50 space-y-3 pointer-events-none">
            {notifications.map((notif) => (
                <div
                    key={notif._id || notif.id}
                    className={`pointer-events-auto flex items-center gap-3 p-4 rounded-xl shadow-2xl border border-white/10 backdrop-blur-md transition-all duration-300 transform translate-x-0 ${notif.type === 'success' ? 'bg-emerald-900/90 text-white' :
                        notif.type === 'error' ? 'bg-rose-900/90 text-white' :
                            notif.type === 'warning' ? 'bg-amber-900/90 text-white' :
                                'bg-slate-900/90 text-white'
                        }`}
                    style={{ minWidth: '300px' }}
                >
                    <div className={`p-2 rounded-full ${notif.type === 'success' ? 'bg-emerald-500/20' :
                        notif.type === 'error' ? 'bg-rose-500/20' :
                            notif.type === 'warning' ? 'bg-amber-500/20' : 'bg-slate-500/20'
                        }`}>
                        {notif.type === 'success' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                        {notif.type === 'error' && <XCircle className="w-5 h-5 text-rose-400" />}
                        {notif.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                        {notif.type === 'info' && <Info className="w-5 h-5 text-cyan-400" />}
                    </div>

                    <div className="flex-1">
                        <p className="text-sm font-bold">{notif.type.toUpperCase()}</p>
                        <p className="text-xs text-slate-300">{notif.message}</p>
                    </div>

                    <button
                        onClick={() => removeNotification(notif._id || notif.id)}
                        className="p-1 hover:bg-white/10 rounded-full transition"
                    >
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>
            ))}
        </div>
    );
}
