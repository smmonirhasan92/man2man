'use client';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Shield, CheckCircle, XCircle, Clock, AlertTriangle, User, RefreshCw, ArrowLeft, MessageSquare, Scale, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

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
            toast.success(`Protocol Executed: ${resolution}`);
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
        <div className="min-h-screen bg-[#070b14] text-slate-200 p-6 md:p-10 font-sans relative overflow-hidden pb-24">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-rose-600/5 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-amber-600/5 rounded-full blur-[120px]"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto space-y-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-6">
                        <Link href="/admin/dashboard" className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95">
                            <ArrowLeft size={24} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <Shield className="w-8 h-8 text-rose-500" />
                                <h1 className="text-3xl font-black text-white tracking-tight uppercase">P2P Tribunal</h1>
                            </div>
                            <p className="text-slate-500 text-xs font-bold tracking-widest uppercase">Dispute Resolution Command Center</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchDisputes}
                        className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Scanning...' : 'Sync Tribunal'}
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-[#0b1221]/80 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] text-center relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -mr-8 -mt-8 blur-2xl group-hover:scale-125 transition-transform duration-700"></div>
                        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-4" />
                        <div className="text-4xl font-black text-white tracking-tighter">{disputes.length}</div>
                        <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Active Disputes</div>
                    </div>
                    <div className="bg-[#0b1221]/80 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] text-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-8 -mt-8 blur-2xl group-hover:scale-125 transition-transform duration-700"></div>
                        <Clock className="w-10 h-10 text-amber-500 mx-auto mb-4" />
                        <div className="text-4xl font-black text-white tracking-tighter">
                            {disputes.filter(d => d.status === 'DISPUTED').length}
                        </div>
                        <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Awaiting Review</div>
                    </div>
                    <div className="bg-[#0b1221]/80 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] text-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-8 -mt-8 blur-2xl group-hover:scale-125 transition-transform duration-700"></div>
                        <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
                        <div className="text-4xl font-black text-white tracking-tighter">
                            {disputes.filter(d => d.status !== 'DISPUTED').length}
                        </div>
                        <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Closed Cases</div>
                    </div>
                </div>

                {/* Disputes List */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-4">
                        <div className="w-12 h-12 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin"></div>
                        <p className="font-bold tracking-widest uppercase text-xs">Accessing Case Files...</p>
                    </div>
                ) : disputes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-[#0b1221]/40 border border-dashed border-white/10 rounded-[3.5rem] text-center">
                        <Scale className="w-20 h-20 text-slate-800 mb-6" />
                        <h3 className="text-2xl font-black text-slate-600 uppercase tracking-widest">Peace Restored</h3>
                        <p className="text-slate-500 text-sm mt-2 max-w-sm">No active P2P disputes detected. System integrity is at 100%.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {disputes.map((trade) => (
                            <div key={trade._id} className="group bg-[#0b1221]/80 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-8 md:p-12 hover:border-rose-500/30 transition-all duration-500 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 group-hover:w-2 transition-all"></div>
                                
                                {/* Case ID & Status */}
                                <div className="flex flex-col md:flex-row items-start justify-between gap-6 mb-10">
                                    <div>
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="px-4 py-1.5 bg-black/40 border border-white/10 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">CASE ID: #{trade._id?.slice(-8)}</span>
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${statusColor(trade.status)}`}>
                                                {trade.status}
                                            </span>
                                        </div>
                                        <h2 className="text-4xl font-black text-white tracking-tighter">
                                            {Number(trade.amount || 0).toLocaleString()} <span className="text-slate-500 text-2xl font-medium tracking-normal">NXS</span>
                                        </h2>
                                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                                            <Clock className="w-3 h-3" /> Reported {new Date(trade.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="bg-rose-500/5 border border-rose-500/10 p-6 rounded-[2rem] max-w-md w-full">
                                        <div className="flex items-center gap-2 text-rose-500 text-[10px] font-black uppercase tracking-widest mb-2">
                                            <AlertTriangle className="w-4 h-4" /> Dispute Claim
                                        </div>
                                        <p className="text-white text-sm font-bold leading-relaxed italic">
                                            "{trade.disputeReason || 'No detailed reason provided.'}"
                                        </p>
                                    </div>
                                </div>

                                {/* Involved Entities */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                    <div className="bg-black/40 border border-white/5 rounded-[2rem] p-6 flex items-center gap-4 group/card hover:border-indigo-500/20 transition-all">
                                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 group-hover/card:scale-110 transition-transform">
                                            <User className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-0.5">Buyer Identification</p>
                                            <p className="text-lg font-black text-white uppercase tracking-tight">
                                                {trade.buyerId?.username || trade.buyerId?.fullName || "ENTITY_UNKNOWN"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-black/40 border border-white/5 rounded-[2rem] p-6 flex items-center gap-4 group/card hover:border-amber-500/20 transition-all">
                                        <div className="w-14 h-14 bg-amber-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-600/20 group-hover/card:scale-110 transition-transform">
                                            <Shield className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-0.5">Seller Identification</p>
                                            <p className="text-lg font-black text-white uppercase tracking-tight">
                                                {trade.sellerId?.username || trade.sellerId?.fullName || "ENTITY_UNKNOWN"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Judicial Actions */}
                                {trade.status === 'DISPUTED' && (
                                    <div className="space-y-6 pt-10 border-t border-white/5">
                                        <div className="relative">
                                            <div className="absolute top-4 left-4 text-slate-500">
                                                <MessageSquare className="w-5 h-5" />
                                            </div>
                                            <textarea
                                                rows={2}
                                                placeholder="Judicial summary / Admin resolution note..."
                                                value={notes[trade._id] || ''}
                                                onChange={e => setNotes(prev => ({ ...prev, [trade._id]: e.target.value }))}
                                                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white font-bold placeholder-slate-700 outline-none focus:border-rose-500/50 transition-all shadow-inner resize-none"
                                            />
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <button
                                                onClick={() => resolve(trade._id, 'RELEASE_TO_BUYER')}
                                                disabled={!!resolving}
                                                className="flex-1 group/btn flex items-center justify-center gap-3 px-8 py-5 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                                            >
                                                {resolving === trade._id + 'RELEASE_TO_BUYER'
                                                    ? <RefreshCw className="w-5 h-5 animate-spin" />
                                                    : <CheckCircle className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                                }
                                                RELEASE TO BUYER
                                            </button>
                                            <button
                                                onClick={() => resolve(trade._id, 'REFUND_TO_SELLER')}
                                                disabled={!!resolving}
                                                className="flex-1 group/btn flex items-center justify-center gap-3 px-8 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                                            >
                                                {resolving === trade._id + 'REFUND_TO_SELLER'
                                                    ? <RefreshCw className="w-5 h-5 animate-spin" />
                                                    : <Zap className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                                }
                                                REFUND TO SELLER
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {trade.status !== 'DISPUTED' && trade.adminNote && (
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] p-8 flex items-start gap-4">
                                        <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 mt-0.5">
                                            <CheckCircle className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-emerald-400 tracking-widest mb-1">Judicial Verdict</p>
                                            <p className="text-white text-sm font-bold italic leading-relaxed">
                                                "{trade.adminNote}"
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
