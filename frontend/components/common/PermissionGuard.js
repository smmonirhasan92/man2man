import React, { useState, useEffect } from 'react';
import { Bell, Volume2, ShieldCheck, Zap } from 'lucide-react';

export default function PermissionGuard({ children }) {
    const [isBlocked, setIsBlocked] = useState(true);
    const [audioUnlocked, setAudioUnlocked] = useState(false);
    const [notifPermission, setNotifPermission] = useState('default');

    useEffect(() => {
        // Check if already allowed in this session
        const setupDone = sessionStorage.getItem('m2m_setup_done');
        const permission = Notification.permission;
        
        if (setupDone === 'true' && permission === 'granted') {
            setIsBlocked(false);
        }
        setNotifPermission(permission);
    }, []);

    const handleEnableAll = async () => {
        try {
            // 1. Unlock Audio Context
            const audio = new Audio('https://usaaffiliatemarketing.com/sounds/tick-v2.mp3');
            audio.volume = 0.1;
            await audio.play();
            setAudioUnlocked(true);

            // 2. Request Notification Permission
            const permission = await Notification.requestPermission();
            setNotifPermission(permission);

            // 3. Save State & Unlock UI
            if (permission === 'granted') {
                sessionStorage.setItem('m2m_setup_done', 'true');
                setIsBlocked(false);
            } else {
                alert("Please allow notifications to receive trade alerts!");
            }
        } catch (e) {
            console.error("Setup failed", e);
        }
    };

    if (!isBlocked) return children;

    return (
        <div className="fixed inset-0 z-[9999] bg-[#020617] flex items-center justify-center p-6 overflow-hidden font-sans">
            {/* Background Decorative Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse"></div>

            <div className="w-full max-w-md bg-[#0f172a]/80 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative animate-in fade-in zoom-in duration-500">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-2xl rotate-12 group">
                        <ShieldCheck className="w-12 h-12 text-white -rotate-12 group-hover:scale-110 transition-transform" />
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
                        Unlock Real-time Experience
                    </h1>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">
                        To receive instant P2P trade alerts and real-time chat sounds, we need your permission.
                    </p>

                    <div className="space-y-4 mb-10">
                        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                                <Bell className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <div className="text-sm font-bold text-white">Push Notifications</div>
                                <div className="text-[10px] text-slate-500 font-bold uppercase">Never miss a trade match</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <Volume2 className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <div className="text-sm font-bold text-white">High-Priority Audio</div>
                                <div className="text-[10px] text-slate-500 font-bold uppercase">Instant chat & payment alerts</div>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleEnableAll}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-2xl text-white font-black uppercase tracking-widest text-sm shadow-[0_20px_40px_rgba(37,99,235,0.3)] hover:shadow-[0_20px_50px_rgba(37,99,235,0.5)] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 group"
                    >
                        <Zap className="w-4 h-4 fill-white animate-bounce" />
                        Activate Real-time Engine
                    </button>

                    <p className="mt-6 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        USA Affiliate Secure Node Network
                    </p>
                </div>
            </div>
        </div>
    );
}
