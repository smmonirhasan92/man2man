'use client';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Shield, CheckCircle, XCircle, Clock, AlertTriangle, User, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function P2PTribunalPage() {
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [resolving, setResolving] = useState(null);
    const [notes, setNotes] = useState({});

    const fetchDisputes = async () => {
        setLoading(true);
        try {
            const res = await api.get('/p2p/admin/disputes');
            setDisputes(res.data?.trades || res.data || []);
        } catch (e) {
            toast.error('Failed to load disputes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDisputes(); }, []);

    const resolve = async (tradeId, resolution) => {
        setResolving(tradeId + resolution);
        try {
            await api.post('/p2p/admin/resolve', {
                tradeId,
                resolution,
                note: notes[tradeId] || ''
            });
            toast.success(`Trade resolved: ${resolution}`);
            fetchDisputes();
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Resolution failed');
        } finally {
            setResolving(null);
        }
    };

    const statusColor = (s) => {
        if (s === 'DISPUTED') return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
        if (s === 'COMPLETED') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
        return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans pb-20">
            {/* Header */}
            <header className="bg-[#0D0D0D] border-b border-rose-500/20 sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-500/20 rounded-xl">
                        <Shield className="w-6 h-6 text-rose-400" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black uppercase tracking-widest text-rose-400">P2P Tribunal</h1>
                        <p className="text-slate-500 text-xs">Dispute Resolution Center</p>
                    </div>
                </div>
                <button
                    onClick={fetchDisputes}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold hover:bg-white/10 transition"
                >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
            </header>

            <main className="px-6 py-8 max-w-5xl mx-auto">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-[#0f0f0f] border border-white/5 p-5 rounded-xl text-center">
                        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                        <div className="text-2xl font-black text-white">{disputes.length}</div>
                        <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Open Disputes</div>
                    </div>
                    <div className="bg-[#0f0f0f] border border-white/5 p-5 rounded-xl text-center">
                        <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                        <div className="text-2xl font-black text-white">
                            {disputes.filter(d => d.status === 'DISPUTED').length}
                        </div>
                        <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Awaiting Review</div>
                    </div>
                    <div className="bg-[#0f0f0f] border border-white/5 p-5 rounded-xl text-center">
                        <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <div className="text-2xl font-black text-white">
                            {disputes.filter(d => d.status !== 'DISPUTED').length}
                        </div>
                        <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Resolved</div>
                    </div>
                </div>

                {/* Disputes List */}
                {loading ? (
                    <div className="text-center py-20 text-slate-500">Loading disputes...</div>
                ) : disputes.length === 0 ? (
                    <div className="text-center py-20">
                        <CheckCircle className="w-16 h-16 text-emerald-500/30 mx-auto mb-4" />
                        <p className="text-slate-500 text-lg font-bold">No Active Disputes</p>
                        <p className="text-slate-600 text-sm mt-1">All P2P trades are running smoothly.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {disputes.map((trade) => (
                            <div key={trade._id} className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition">
                                {/* Trade Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-xs font-mono text-slate-500">#{trade._id?.slice(-8)}</span>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${statusColor(trade.status)}`}>
                                                {trade.status}
                                            </span>
                                        </div>
                                        <div className="text-xl font-black text-white">
                                            {Number(trade.amount || 0).toLocaleString()} NXS
                                        </div>
                                        <div className="text-slate-500 text-xs mt-1">
                                            {new Date(trade.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-slate-500 mb-1">Dispute Reason</div>
                                        <div className="text-sm text-rose-400 font-bold max-w-[200px] text-right">
                                            {trade.disputeReason || 'No reason provided'}
                                        </div>
                                    </div>
                                </div>

                                {/* Parties */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-white/5 rounded-xl p-4">
                                        <div className="text-[10px] font-bold uppercase text-slate-500 tracking-widest mb-2 flex items-center gap-1">
                                            <User className="w-3 h-3" /> Buyer
                                        </div>
                                        <div className="text-sm font-bold text-white">
                                            {trade.buyerId?.username || trade.buyerId?.fullName || String(trade.buyerId)?.slice(-8)}
                                        </div>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-4">
                                        <div className="text-[10px] font-bold uppercase text-slate-500 tracking-widest mb-2 flex items-center gap-1">
                                            <User className="w-3 h-3" /> Seller
                                        </div>
                                        <div className="text-sm font-bold text-white">
                                            {trade.sellerId?.username || trade.sellerId?.fullName || String(trade.sellerId)?.slice(-8)}
                                        </div>
                                    </div>
                                </div>

                                {/* Admin Note */}
                                {trade.status === 'DISPUTED' && (
                                    <>
                                        <textarea
                                            rows={2}
                                            placeholder="Admin resolution note (optional)..."
                                            value={notes[trade._id] || ''}
                                            onChange={e => setNotes(prev => ({ ...prev, [trade._id]: e.target.value }))}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 resize-none focus:outline-none focus:border-white/20 mb-4"
                                        />

                                        {/* Resolution Buttons */}
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => resolve(trade._id, 'RELEASE_TO_BUYER')}
                                                disabled={!!resolving}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl font-bold text-sm hover:bg-emerald-500/20 transition disabled:opacity-50"
                                            >
                                                {resolving === trade._id + 'RELEASE_TO_BUYER'
                                                    ? <RefreshCw className="w-4 h-4 animate-spin" />
                                                    : <CheckCircle className="w-4 h-4" />
                                                }
                                                Favor Buyer
                                            </button>
                                            <button
                                                onClick={() => resolve(trade._id, 'REFUND_TO_SELLER')}
                                                disabled={!!resolving}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-xl font-bold text-sm hover:bg-blue-500/20 transition disabled:opacity-50"
                                            >
                                                {resolving === trade._id + 'REFUND_TO_SELLER'
                                                    ? <RefreshCw className="w-4 h-4 animate-spin" />
                                                    : <CheckCircle className="w-4 h-4" />
                                                }
                                                Favor Seller
                                            </button>
                                        </div>
                                    </>
                                )}

                                {trade.status !== 'DISPUTED' && trade.adminNote && (
                                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 text-sm text-emerald-400">
                                        <span className="font-bold">Admin Note:</span> {trade.adminNote}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
