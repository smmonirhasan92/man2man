'use client';
import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Eye, FileText, Ban, Shield, MessageSquare, Bell } from 'lucide-react';
import USCIcon from '../ui/USCIcon';
import toast from 'react-hot-toast';
import ConfirmationModal from '../ui/ConfirmationModal';

export default function P2PCommandCenter() {
    const socket = useSocket();
    const [trades, setTrades] = useState([]);
    const [selectedTrade, setSelectedTrade] = useState(null);
    const [chatHistory, setChatHistory] = useState([]);
    const [loadingChat, setLoadingChat] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false });

    // Audio Ref
    const audioRef = useRef(null);

    useEffect(() => {
        fetchMarket();
    }, []);

    useEffect(() => {
        if (!socket) return;

        // Join Admin Room
        socket.emit('join_admin_room', 'ADMIN_SECRET');

        socket.on('p2p_alert', (data) => {
            toast(data.message, { icon: '🚨', duration: 5000 });
            playAlertSound();
            fetchMarket();
        });

        return () => {
            socket.off('p2p_alert');
        };
    }, [socket]);

    const playAlertSound = () => {
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.log("Audio play blocked"));
        }
    };

    const fetchMarket = async () => {
        try {
            const tradeRes = await api.get('/p2p/admin/trades');
            setTrades(tradeRes.data);

            // Auto-select first awaiting trade if none selected
            if (!selectedTrade) {
                const pending = tradeRes.data.find(t => ['AWAITING_ADMIN', 'DISPUTE'].includes(t.status));
                if (pending) selectTrade(pending);
            }
        } catch (e) { console.error(e); }
    };

    const selectTrade = async (trade) => {
        setSelectedTrade(trade);
        setLoadingChat(true);
        try {
            const res = await api.get(`/p2p/trade/${trade._id}/chat`);
            setChatHistory(res.data);
        } catch (e) {
            console.error("Chat fetch fail", e);
        } finally {
            setLoadingChat(false);
        }
    };

    const approve = (tradeId) => {
        setConfirmModal({
            isOpen: true,
            title: 'FORCE RELEASE FUNDS',
            message: 'Tribunal action: Release locked funds to the BUYER? This is irreversible.',
            confirmText: 'Release to Buyer',
            onConfirm: async () => {
                try {
                    await api.post('/p2p/admin/resolve', { tradeId, resolution: 'RELEASE_TO_BUYER' });
                    toast.success("FUNDS RELEASED TO BUYER");
                    fetchMarket();
                    setSelectedTrade(null);
                    setConfirmModal({ isOpen: false });
                } catch (e) {
                    toast.error(e.response?.data?.message || "Failed");
                }
            }
        });
    };

    const reject = (tradeId) => {
        setConfirmModal({
            isOpen: true,
            title: 'FORCE REFUND TO SELLER',
            message: 'Tribunal action: Cancel the trade and return locked funds to the SELLER?',
            confirmText: 'Refund Seller',
            onConfirm: async () => {
                try {
                    await api.post('/p2p/admin/resolve', { tradeId, resolution: 'REFUND_TO_SELLER' });
                    toast.success("FUNDS REFUNDED TO SELLER");
                    fetchMarket();
                    setSelectedTrade(null);
                    setConfirmModal({ isOpen: false });
                } catch (e) {
                    toast.error(e.response?.data?.message || "Failed");
                }
            }
        });
    };

    const [isMobileView, setIsMobileView] = useState(false);

    // Responsive check (basic)
    useEffect(() => {
        const checkMobile = () => setIsMobileView(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const pendingTrades = trades.filter(t => ['AWAITING_ADMIN', 'DISPUTE'].includes(t.status));

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6 text-white font-sans">
            <audio ref={audioRef} src="/sounds/alert.mp3" preload="auto" />

            {/* LEFT: INBOX */}
            <div className={`w-full md:w-1/3 bg-[#111] border border-white/10 rounded-2xl flex flex-col overflow-hidden ${selectedTrade && isMobileView ? 'hidden' : 'flex'}`}>
                <div className="p-4 border-b border-white/10 bg-slate-900/50 flex justify-between items-center">
                    <h2 className="font-bold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" /> Disputes ({pendingTrades.length})
                    </h2>
                    <button onClick={fetchMarket}><RefreshCw className="w-4 h-4" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {pendingTrades.length === 0 && <div className="p-4 text-center text-slate-500 text-sm">All clear, Commander.</div>}
                    {pendingTrades.map(t => (
                        <div
                            key={t._id}
                            onClick={() => selectTrade(t)}
                            className={`p-4 rounded-xl cursor-pointer border transition-all ${selectedTrade?._id === t._id ? 'bg-indigo-600/20 border-indigo-500' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                        >
                            <div className="flex justify-between mb-1">
                                <span className="font-bold text-sm text-slate-300">Order #{t._id.substr(-4)}</span>
                                <span className="text-[10px] font-black tracking-widest px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/20">{t.status}</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-xs text-slate-400">{t.sellerId?.username} → {t.buyerId?.username}</div>
                                </div>
                                <div className="font-black font-mono flex items-center gap-1">
                                    <USCIcon className="w-4 h-4" /> {t.amount}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT: INSPECTOR */}
            <div className={`w-full md:w-2/3 flex flex-col gap-6 ${!selectedTrade && isMobileView ? 'hidden' : 'flex'}`}>
                {selectedTrade ? (
                    <>
                        {/* 1. TOP: DECISION PANEL */}
                        <div className="bg-[#1a1b2e] border border-indigo-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                            {/* Mobile Back Button */}
                            {isMobileView && (
                                <button onClick={() => setSelectedTrade(null)} className="mb-4 text-xs text-slate-400 flex items-center gap-1">
                                    ← Back to List
                                </button>
                            )}

                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

                            <div className="flex flex-col md:flex-row justify-between items-start relative z-10 gap-4">
                                <div>
                                    <h3 className="text-2xl font-black mb-1 flex items-center gap-2">
                                        <Shield className="w-6 h-6 text-emerald-400" /> Tribunal Audit
                                    </h3>
                                    <p className="text-slate-400 text-sm mb-4">Investigate evidence, force resolution.</p>

                                    {selectedTrade.status === 'DISPUTE' && selectedTrade.disputeReason && (
                                        <div className="mb-4 bg-red-950/40 border border-red-500/30 p-3 rounded-xl max-w-sm">
                                            <div className="text-[10px] uppercase font-bold text-red-400 mb-1 flex justify-between">
                                                <span>Dispute Reason</span>
                                                <span>Reported By: {selectedTrade.disputeRaisedBy === selectedTrade.buyerId?._id ? 'BUYER' : 'SELLER'}</span>
                                            </div>
                                            <div className="text-sm text-red-100">{selectedTrade.disputeReason}</div>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-8 text-sm">
                                        <div>
                                            <div className="text-xs uppercase text-slate-500 font-bold">Trading Amount</div>
                                            <div className="text-xl font-mono font-bold flex items-center gap-2">
                                                <USCIcon className="w-5 h-5" /> {selectedTrade.amount}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs uppercase text-slate-500 font-bold">Admin Fee (2%)</div>
                                            <div className="text-xl font-mono font-bold text-emerald-400 flex items-center gap-2">
                                                <USCIcon className="w-5 h-5" /> {(selectedTrade.amount * 0.02).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button onClick={() => approve(selectedTrade._id)} className="w-full md:w-48 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex flex-col items-center leading-none gap-1 border border-emerald-400/50">
                                        <span className="text-[10px] opacity-70">Force Action</span>
                                        <span>Release to Buyer</span>
                                    </button>
                                    <button onClick={() => reject(selectedTrade._id)} className="w-full md:w-48 py-4 bg-red-900/60 border border-red-500/50 hover:bg-red-500 hover:text-white text-red-500 font-bold uppercase tracking-wider rounded-xl transition-all flex flex-col items-center justify-center gap-1 shadow-lg shadow-red-900/20">
                                        <span className="text-[10px] opacity-80">Force Action</span>
                                        <span className="flex items-center gap-1"><Ban className="w-3 h-3" /> Refund Seller</span>
                                    </button>

                                    {/* Fail-Safe */}
                                    <button onClick={() => {
                                        setConfirmModal({
                                            isOpen: true,
                                            title: 'EMERGENCY UNLOCK',
                                            message: 'EMERGENCY: Force unlock stuck funds back to seller? This action is irreversible.',
                                            confirmText: 'FORCE UNLOCK',
                                            onConfirm: () => {
                                                setConfirmModal(prev => ({ ...prev, isOpen: false })); // Close first to run logic? or Just run logic
                                                // Actually logic is same as reject(refund)
                                                // We can re-use logic but bypassing the wrapper
                                                // Let's just call the api directly inside logic
                                                api.post('/p2p/admin/resolve', { tradeId: selectedTrade._id, resolution: 'REFUND_TO_SELLER' })
                                                    .then(() => { toast.success("FORCED UNLOCK"); fetchMarket(); setSelectedTrade(null); })
                                                    .catch(e => toast.error(e.response?.data?.message || "Failed"));
                                            }
                                        });
                                    }} className="text-[10px] text-slate-500 hover:text-red-400 underline mt-2">
                                        Manual Unlock (Emergency)
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 2. SPLIT: PROOF & CHAT */}
                        <div className="flex-1 flex gap-6 min-h-0">
                            {/* PROOF */}
                            <div className="w-1/2 bg-black border border-white/10 rounded-2xl p-4 flex flex-col">
                                <h4 className="font-bold text-sm text-slate-400 mb-2 flex items-center gap-2"><Eye className="w-4 h-4" /> Payment Proof</h4>
                                <div className="flex-1 bg-slate-900 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden relative">
                                    {selectedTrade.paymentProofUrl ? (
                                        <a href={selectedTrade.paymentProofUrl} target="_blank" rel="noreferrer" className="block w-full h-full relative group">
                                            <img src={selectedTrade.paymentProofUrl} className="w-full h-full object-contain" alt="Proof" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                                <span className="bg-white text-black px-4 py-2 rounded-full font-bold text-xs">Click to Zoom</span>
                                            </div>
                                        </a>
                                    ) : (
                                        <div className="text-center text-slate-500">
                                            <Ban className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            No Proof Uploaded
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* CHAT LOGS */}
                            <div className="w-1/2 bg-[#0a0f1e] border border-white/10 rounded-2xl flex flex-col p-4">
                                <h4 className="font-bold text-sm text-slate-400 mb-2 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Live Chat Log</h4>
                                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                                    {loadingChat && <div className="text-center text-xs animate-pulse text-indigo-400"> decrypting logs...</div>}
                                    {chatHistory.map((msg, i) => (
                                        <div key={i} className={`text-xs p-2 rounded-lg ${msg.senderId === selectedTrade.buyerId._id ? 'bg-blue-900/20 text-blue-200 border border-blue-500/10 ml-0 mr-8' : 'bg-emerald-900/20 text-emerald-200 border border-emerald-500/10 ml-8 mr-0'}`}>
                                            <div className="font-bold text-[10px] opacity-50 mb-1">{msg.senderId === selectedTrade.buyerId._id ? 'BUYER' : 'SELLER'}</div>
                                            {msg.text}
                                            {msg.imageUrl && <div className="mt-1 text-[10px] text-indigo-400">[Image Attachment]</div>}
                                        </div>
                                    ))}
                                    {chatHistory.length === 0 && !loadingChat && <div className="text-center text-[10px] text-slate-600 mt-10">No messages exchanged.</div>}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 bg-[#111] border border-white/5 border-dashed rounded-3xl flex items-center justify-center flex-col gap-4 text-slate-500">
                        <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center">
                            <Shield className="w-10 h-10 opacity-20" />
                        </div>
                        <p>Select a trade to commence security audit.</p>
                    </div>
                )}
            </div>
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText || 'Confirm'}
            />
        </div>
    );
}
