'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Shield, Globe, Power, CheckCircle, Wifi, Lock, Smartphone, X, ArrowLeft } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import VerificationModal from '../../components/VerificationModal';
import ConnectionFlow from '../../components/ConnectionFlow';

export default function ServerDashboard() {
    const [servers, setServers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(null); // planId being connected
    const [activeServerId, setActiveServerId] = useState(null);
    const [verificationModal, setVerificationModal] = useState(null); // { plan } or null
    const router = useRouter();

    useEffect(() => {
        fetchServers();
        const stored = localStorage.getItem('active_server_id');
        if (stored) setActiveServerId(stored);
    }, []);

    const fetchServers = async () => {
        try {
            const { data } = await api.get('/plan/my-plans');
            // [FIX] Handle array or nested object
            setServers(Array.isArray(data) ? data : data.plans || []);
        } catch (e) {
            console.error(e);
            toast.error("Failed to load servers.");
        } finally {
            setLoading(false);
        }
    };

    const initiateConnect = (plan) => {
        if (!plan.syntheticPhone || plan.syntheticPhone === 'Generating...') {
            toast.error("Server is provisioning. Please wait.");
            return;
        }
        setVerificationModal(plan);
    };

    const [vpsModal, setVpsModal] = useState(null); // { plan }

    // Called by Verification Modal on success
    const handleVerifySuccess = (plan) => {
        setVerificationModal(null);
        setVpsModal(plan);
        // Logic continues in handleVPSComplete
    };

    const handleVPSComplete = async () => {
        const plan = vpsModal;
        if (!plan) return;

        // Backend Handshake (Silent now, animation handled checks visual)
        try {
            await api.post('/task/verify-connection', {
                planId: plan._id,
                syntheticPhone: plan.syntheticPhone
            });

            localStorage.setItem('active_server_id', plan._id);
            localStorage.setItem('active_server_name', plan.planName);
            localStorage.setItem('active_server_phone', plan.syntheticPhone);

            setActiveServerId(plan._id);
            router.push('/tasks');

        } catch (err) {
            console.error(err);
            toast.error("Handshake Failed. Re-verifying...");
            setVpsModal(null);
        }
    };

    const handleDeploy = () => {
        router.push('/marketplace');
    };
    const handleDisconnect = () => {
        toast((t) => (
            <div className="flex flex-col gap-2">
                <span className="text-xs font-bold">Disconnect from secure server?</span>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            localStorage.removeItem('active_server_id');
                            localStorage.removeItem('active_server_name');
                            localStorage.removeItem('active_server_phone'); // [NEW] Clear Key
                            setActiveServerId(null);
                            toast.dismiss(t.id);
                            toast.success("Disconnected successfully.");
                        }}
                        className="bg-red-500 text-white px-3 py-1 rounded text-[10px] font-bold"
                    >
                        Confirm
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="bg-slate-700 text-white px-3 py-1 rounded text-[10px] font-bold"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ), {
            duration: 5000,
            style: {
                background: '#0f172a',
                border: '1px solid #dc2626',
                color: '#fff',
            }
        });
    };

    if (loading) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 font-mono text-xs animate-pulse">LOCATING ASSETS...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050505] text-white pb-24 relative overflow-hidden">
            <AnimatePresence>
                {verificationModal && (
                    <VerificationModal
                        plan={verificationModal}
                        onClose={() => setVerificationModal(null)}
                        onSuccess={handleVerifySuccess}
                    />
                )}
            </AnimatePresence>

            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-indigo-900/20 to-transparent pointer-events-none"></div>

            <div className="p-6 pt-10 relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <div
                                onClick={() => router.push('/dashboard')}
                                className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition cursor-pointer"
                            >
                                <ArrowLeft size={20} className="text-white" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                            <Shield className="fill-indigo-500 text-indigo-500" size={24} />
                            SERVER FLEET
                        </h1>
                        <p className="text-slate-400 text-xs font-mono mt-1">USA SECURE GATEWAY</p>
                    </div>
                </div>

                {servers.length === 0 ? (
                    <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-white/5">
                        <Server size={48} className="text-slate-700 mx-auto mb-4" />
                        <h3 className="text-slate-300 font-bold">No Active Servers</h3>
                        <p className="text-slate-500 text-sm mt-2 mb-6">Purchase a plan to deploy your personal task server.</p>
                        <button onClick={() => router.push('/marketplace')} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold text-sm tracking-wide transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                            DEPLOY SERVER
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {servers.map((server) => (
                            <ServerCard
                                key={server._id}
                                server={server}
                                onConnect={initiateConnect}
                                onDisconnect={handleDisconnect}
                                isConnecting={connecting === server._id}
                                isActive={activeServerId === server._id}
                                hasActive={!!activeServerId}
                            />
                        ))}
                    </div>
                )}
            </div>
            {/* Verification Modal */}
            <AnimatePresence>
                {verificationModal && (
                    <VerificationModal
                        plan={verificationModal}
                        onClose={() => setVerificationModal(null)}
                        onSuccess={handleVerifySuccess}
                    />
                )}
            </AnimatePresence>

            {/* VPS Animation Overlay */}
            <AnimatePresence>
                {vpsModal && (
                    <ConnectionFlow
                        plan={vpsModal}
                        onComplete={handleVPSComplete}
                    />
                )}
            </AnimatePresence>
        </div> // End of ServerDashboard Container
    );
}

function ServerCard({ server, onConnect, onDisconnect, isConnecting, isActive, hasActive }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden relative group"
        >
            {/* Glowing Border effect on hover */}
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-indigo-500/30 rounded-2xl transition-all duration-500 pointer-events-none"></div>

            <div className="p-5">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                            <Server className="text-indigo-400" size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">{server.planName}</h3>
                            <div className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block mt-1 flex items-center gap-1 w-fit">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                                ONLINE
                            </div>
                        </div>
                    </div>
                    <Globe className="text-slate-600" size={40} strokeWidth={1} />
                </div>

                {/* Specs */}
                <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                        <span className="text-slate-500">IP Address</span>
                        <span className="font-mono text-slate-300 tracking-wider">{server.serverIp || '104.28.XX.XX'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                        <span className="text-slate-500">Location</span>
                        <span className="font-medium text-white flex items-center gap-1.5">
                            <img src="https://flagcdn.com/us.svg" alt="USA" className="w-4 h-3 object-cover rounded-[1px]" />
                            {server.serverLocation || 'Virginia, USA'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-1">
                        <span className="text-slate-500">Virtual Number</span>
                        <span className="font-mono text-indigo-300">{server.syntheticPhone || '+1 (703) XXX-XXXX'}</span>
                    </div>
                </div>

                {/* Action */}
                {isActive ? (
                    <button
                        onClick={onDisconnect}
                        className="w-full py-4 rounded-xl font-black text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 shadow-[0_4px_20px_rgba(220,38,38,0.1)]"
                    >
                        <Power size={18} />
                        DISCONNECT SYSTEM
                    </button>
                ) : (
                    // [MODIFIED] Allow switching servers easily
                    <button
                        onClick={() => onConnect(server)}
                        disabled={isConnecting}
                        className={`w-full py-4 rounded-xl font-black text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-3 ${isConnecting
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]'
                            }`}
                    >
                        {isConnecting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                CONNECTING...
                            </>
                        ) : (
                            <>
                                <Wifi size={18} />
                                CONNECT SERVER
                            </>
                        )}
                    </button>
                )}
            </div>
        </motion.div>
    );
}
