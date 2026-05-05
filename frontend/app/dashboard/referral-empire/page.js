'use client';
import ReferralDashboard from '../../../components/referral/ReferralDashboard';
import ReferralNetworkUI from '../../../components/profile/ReferralNetworkUI';
import { ArrowLeft, Lock } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';

export default function ReferralEmpirePage() {
    const [lockedCommissions, setLockedCommissions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchLocked();
    }, []);

    const fetchLocked = async () => {
        try {
            const res = await api.get('/referral/dashboard-data');
            setLockedCommissions(res.data.lockedCommissions || []);
        } catch (e) { console.error(e); }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200">
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-black/20 backdrop-blur-xl flex items-center gap-4 sticky top-0 z-50">
                <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-full transition text-white">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-lg font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-600 uppercase">
                    Referral Empire
                </h1>
            </div>

            <div className="max-w-md mx-auto p-4 pb-32 space-y-8">
                <ReferralDashboard />
                
                {/* Network Visualization */}
                <ReferralNetworkUI />

                {/* Locked Commissions Section (Moved from Profile) */}
                <div className="bg-[#0f172a] p-6 rounded-[2rem] border border-white/5 space-y-4 shadow-2xl">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5 text-amber-500" /> Locked Commissions
                        </label>
                        <span className="text-[10px] font-black text-slate-400">5-Day Lock Protocol</span>
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                        {lockedCommissions.length === 0 ? (
                            <div className="text-center py-8 bg-white/[0.02] rounded-2xl border border-dashed border-white/5">
                                <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">No Locked Assets Found</p>
                            </div>
                        ) : (
                            lockedCommissions.map((trx) => {
                                const releaseDate = new Date(trx.metadata?.releaseDate);
                                const isMatured = releaseDate <= new Date();
                                return (
                                    <div key={trx._id} className="bg-white/[0.03] p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all">
                                        <div>
                                            <p className="text-sm font-black text-white">${(trx.amount / 100).toFixed(2)}</p>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">
                                                {isMatured ? 'MATURED ✓' : `RELEASES: ${releaseDate.toLocaleDateString()}`}
                                            </p>
                                        </div>
                                        <button
                                            disabled={!isMatured || loading}
                                            onClick={async () => {
                                                setLoading(true);
                                                try {
                                                    await api.post('/referral/claim', { transactionId: trx._id });
                                                    toast.success(`Claimed $${(trx.amount / 100).toFixed(2)}! 💰`);
                                                    fetchLocked();
                                                } catch (e) {
                                                    toast.error(e.response?.data?.message || 'Claim failed');
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                                                isMatured 
                                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20' 
                                                : 'bg-white/5 text-slate-600 cursor-not-allowed'
                                            }`}
                                        >
                                            {isMatured ? 'CLAIM' : <Lock className="w-3 h-3" />}
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
