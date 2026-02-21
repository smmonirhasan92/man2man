'use client';
import { useState, useEffect } from 'react';
import { X, Server, MessageSquare, LogOut, Settings, Wallet, Copy } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AnimatePresence } from 'framer-motion';
import ConnectionFlow from '../ConnectionFlow';

export default function ProfileDrawer({ isOpen, onClose, user, logout }) {
    const [activeTab, setActiveTab] = useState('servers'); // 'servers' | 'otp'
    const [servers, setServers] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [connectingPlan, setConnectingPlan] = useState(null);
    const router = useRouter();

    const handleFlowComplete = async () => {
        const plan = connectingPlan;
        setConnectingPlan(null);
        if (!plan) return;

        try {
            await api.post('/task/verify-connection', {
                planId: plan._id,
                syntheticPhone: plan.syntheticPhone
            });

            localStorage.setItem('active_server_id', plan._id);
            localStorage.setItem('active_server_name', plan.planName);
            localStorage.setItem('active_server_phone', plan.syntheticPhone);

            toast.success("Secure Tunnel Established", { icon: '🛡️' });
            router.push('/tasks');
            onClose();

        } catch (err) {
            console.error(err);
            toast.error("Handshake Failed. Re-verifying...");
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    const fetchData = async () => {
        try {
            const [plansRes, notifRes] = await Promise.all([
                api.get('/plan/my-plans'),
                api.get('/notifications?limit=20')
            ]);
            setServers(plansRes.data);
            setNotifications(notifRes.data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleCopy = async (text, label = "Copied!") => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(label, { icon: '🇺🇸' });
        } catch (err) {
            console.warn('Clipboard API failed, using fallback:', err);
            try {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed"; // Avoid scrolling to bottom
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                toast.success(label, { icon: '🇺🇸' });
            } catch (fallbackErr) {
                console.error('Fallback copy failed:', fallbackErr);
                toast.error("Failed to copy");
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

            {/* Drawer */}
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

                {/* Secure Assets Section */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">

                    {/* [NEW] Marketplace Entry Point */}
                    <button
                        onClick={() => { onClose(); router.push('/marketplace'); }}
                        className="w-full mb-4 py-3 bg-gradient-to-r from-indigo-900 to-slate-900 border border-indigo-500/50 rounded-xl text-xs font-black text-white shadow-lg flex items-center justify-between px-4 hover:scale-[1.02] transition-transform group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-indigo-500 rounded-lg shadow-indigo-500/20">
                                <Server size={16} className="text-white" />
                            </div>
                            <div className="text-left">
                                <div className="uppercase tracking-wider text-[10px] text-indigo-300">New Feature</div>
                                <div className="text-sm">Server Marketplace</div>
                            </div>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                    </button>

                    {/* Tabs */}
                    <div className="flex p-1 bg-slate-900 rounded-xl mb-6">
                        <button
                            onClick={() => setActiveTab('servers')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'servers' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Server size={14} /> My Servers
                        </button>
                        <button
                            onClick={() => setActiveTab('otp')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'otp' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            <MessageSquare size={14} /> OTP Inbox
                        </button>
                    </div>

                    {activeTab === 'servers' ? (
                        <div className="space-y-3">
                            {servers.length === 0 ? (
                                <div className="text-center py-10 text-slate-500 text-xs">No active servers found.</div>
                            ) : (
                                servers.map(server => (
                                    <div key={server._id} className="bg-slate-800/50 p-3 rounded-xl border border-white/5">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold text-indigo-300">{server.planName}</span>
                                            {/* CONNECT BUTTON */}
                                            <button
                                                onClick={() => setConnectingPlan(server)}
                                                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded text-[10px] font-bold transition flex items-center gap-1"
                                            >
                                                <Server size={10} /> CONNECT
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 text-white font-mono text-sm tracking-wide bg-black/30 p-2 rounded lg group/copy cursor-pointer active:scale-95 transition" onClick={() => {
                                            if (server.syntheticPhone && server.syntheticPhone !== 'Generating...') {
                                                handleCopy(server.syntheticPhone, "USA Number Copied!");
                                            }
                                        }}>
                                            <Image src="https://flagcdn.com/us.svg" className="w-4 h-3 rounded-[1px]" alt="USA" width={16} height={12} loading="lazy" />
                                            {server.syntheticPhone || 'Generating...'}
                                            <Copy size={12} className="text-slate-500 group-hover/copy:text-white ml-auto" />
                                        </div>
                                    </div>
                                ))
                            )}
                            <button onClick={() => { onClose(); router.push('/marketplace'); }} className="w-full py-3 mt-4 border border-dashed border-slate-600 text-slate-400 rounded-xl text-xs font-bold hover:bg-white/5 transition flex items-center justify-center gap-2">
                                <Server size={14} /> Purchase New Server
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* OTP List */}
                            {notifications.length === 0 ? (
                                <div className="text-center py-10 text-slate-500 text-xs">Inbox empty.</div>
                            ) : (
                                notifications.map(notif => (
                                    <div key={notif._id} className="bg-slate-800/50 p-3 rounded-xl border border-white/5 hover:bg-slate-800 transition group/otp" onClick={() => {
                                        if (notif.message.includes('Code:')) {
                                            // Extract code simple regex
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
                    )}

                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-white/10 bg-[#1E293B] space-y-2">

                    {/* REFERRAL SYSTEM RELOCATED */}
                    <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5 mb-2">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-yellow-500 flex items-center gap-1"><Settings size={12} className="text-yellow-500" /> My Referral Link</span>
                            <span className="text-[10px] text-slate-500">Earn Commissions</span>
                        </div>
                        <div className="flex items-center gap-2 bg-black/40 p-2 rounded-lg border border-white/5 cursor-pointer active:scale-95 transition group"
                            onClick={() => handleCopy(`https://usaaffiliatemarketing.com/register?ref=${user?.referralCode}`, 'Referral Link Copied!')}>
                            <div className="text-xs text-white truncate font-mono flex-1">
                                .../register?ref={user?.referralCode || '...'}
                            </div>
                            <Copy size={12} className="text-slate-400 group-hover:text-white" />
                        </div>
                    </div>

                    <button onClick={() => router.push('/profile')} className="w-full py-3 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition">
                        <Settings size={14} /> Full Profile Settings
                    </button>
                    <button onClick={logout} className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition">
                        <LogOut size={14} /> Sign Out
                    </button>
                </div>

            </div>

            {/* GLOBAL CONNECTION FLOW */}
            <AnimatePresence>
                {connectingPlan && (
                    <ConnectionFlow
                        plan={connectingPlan}
                        onComplete={handleFlowComplete}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
