'use client';
import { useState, useEffect } from 'react';
import { X, MessageSquare, LogOut, Settings, Copy, Download, Headset } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ProfileDrawer({ isOpen, onClose, user, logout }) {
    const [activeTab, setActiveTab] = useState('otp');
    const [notifications, setNotifications] = useState([]);
    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                try {
                    const notifRes = await api.get('/notifications?limit=20');
                    setNotifications(notifRes.data);
                } catch (e) {
                    console.error(e);
                }
            };
            fetchData();
        }
    }, [isOpen]);

    const handleCopy = async (text, label = "Copied!") => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(label, { icon: '🇺🇸' });
        } catch (err) {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            toast.success(label, { icon: '🇺🇸' });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[99999] flex justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative w-80 h-full bg-[#0F172A] border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#1E293B]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 overflow-hidden relative">
                            <Image src={user?.photoUrl ? `https://usaaffiliatemarketing.com/api${user.photoUrl}` : `https://ui-avatars.com/api/?name=${user?.fullName ? encodeURIComponent(user.fullName) : 'User'}`} className="w-full h-full object-cover" alt="Profile" fill sizes="40px" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-sm">{user?.fullName || 'User'}</h3>
                            <p className="text-[10px] text-emerald-400 font-mono">ID: {user?.referralCode}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {/* Tabs */}
                    <div className="flex p-1 bg-slate-900 rounded-xl mb-6">
                        <button
                            className="flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 bg-indigo-600 text-white shadow-lg"
                        >
                            <MessageSquare size={14} /> Recent Activity
                        </button>
                    </div>

                    <div className="space-y-3">
                        {notifications.length === 0 ? (
                            <div className="text-center py-10 text-slate-500 text-xs">Inbox empty.</div>
                        ) : (
                            notifications.map(notif => (
                                <div key={notif._id} className="bg-slate-800/50 p-3 rounded-xl border border-white/5 hover:bg-slate-800 transition group/otp" onClick={() => {
                                    if (notif.message.includes('Code:')) {
                                        const code = notif.message.match(/Code: (\d+)/)?.[1] || notif.message;
                                        handleCopy(code, "OTP Code Copied!");
                                    }
                                }}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${notif.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                            {notif.type.toUpperCase()}
                                        </span>
                                        <span className="text-[10px] text-slate-500">{new Date(notif.createdAt).toLocaleTimeString()}</span>
                                    </div>
                                    <p className="text-xs text-slate-300 font-medium leading-relaxed flex items-center gap-2">
                                        {notif.message}
                                        {notif.message.includes('Code') && <Copy size={10} className="opacity-0 group-hover/otp:opacity-100 transition" />}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-white/10 bg-[#1E293B] space-y-2">
                    <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5 mb-2">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-yellow-500 flex items-center gap-1"><Settings size={12} className="text-yellow-500" /> Invite Link</span>
                        </div>
                        <div className="flex items-center gap-2 bg-black/40 p-2 rounded-lg border border-white/5 cursor-pointer active:scale-95 transition group"
                            onClick={() => handleCopy(`https://usaaffiliatemarketing.com/register?ref=${user?.referralCode}`, 'Invite Link Copied!')}>
                            <div className="text-xs text-white truncate font-mono flex-1">
                                .../register?ref={user?.referralCode || '...'}
                            </div>
                            <Copy size={12} className="text-slate-400 group-hover:text-white" />
                        </div>
                    </div>

                    <button onClick={() => router.push('/profile')} className="w-full py-3 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition">
                        <Settings size={14} /> Full Profile Settings
                    </button>

                    <button
                        onClick={() => window.triggerPWAInstall?.()}
                        className="w-full py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition uppercase"
                    >
                        <Download size={14} /> Download Official App
                    </button>

                    <button onClick={() => router.push('/support')} className="w-full py-3 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition">
                        <Headset size={14} /> Contact Support
                    </button>

                    <button onClick={logout} className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition">
                        <LogOut size={14} /> Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}
