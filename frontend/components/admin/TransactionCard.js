import React from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { CheckCircle } from 'lucide-react';

export default function TransactionCard({
    trx,
    agents,
    selectedAgentId,
    onSelectAgent,
    onAssign,
    onApprove,
    onReject,
    onView,
    onRefresh
}) {
    const [adminMsg, setAdminMsg] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    // [SOUND] Admin Alert for New Requests
    React.useEffect(() => {
        if (trx.status === 'pending_instructions') {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(() => {});
        }
    }, [trx.status]);

    const handleProvideInstructions = async () => {
        if (!adminMsg) return toast.error('Please enter a number');
        setLoading(true);
        try {
            await api.post('/transactions/provide-instructions', { 
                transactionId: trx._id, 
                adminInstructions: adminMsg 
            });
            toast.success('Number sent to user!');
            if (onRefresh) onRefresh(); 
        } catch (e) { toast.error('Failed to send'); }
        finally { setLoading(false); }
    };

    return (
        <div className="bg-[#111111] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group hover:border-[#D4AF37]/30 transition-all duration-500 mb-6">
            {/* Status Badge */}
            <div className="absolute top-8 right-8 flex flex-col items-end gap-2">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${
                    trx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                    trx.status === 'rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                    trx.status === 'final_review' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20 animate-pulse' :
                    trx.status === 'awaiting_payment' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                    'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20'
                }`}>
                    {trx.status?.replace('_', ' ') || 'pending'}
                </span>
                {trx.status === 'expired' && <span className="text-[9px] text-red-500 font-black animate-bounce uppercase tracking-tighter">Time Expired (20m)</span>}
            </div>

            <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-white/5 rounded-[1.8rem] flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-500">
                    <span className="text-3xl">{trx.type === 'withdraw' ? '📤' : '📥'}</span>
                </div>
                
                <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-black text-white text-xl tracking-tight">{trx.userId?.fullName || 'Unknown User'}</h3>
                        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded font-black text-slate-500 uppercase tracking-widest">@{trx.userId?.username || 'user'}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F9E29C] tracking-tighter">
                            {trx.amount?.toLocaleString()} NXS
                        </p>
                        <div className="flex flex-col">
                            <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Payable</p>
                            <p className="text-sm font-black text-white tracking-tighter">{(trx.amount * 1.23).toLocaleString(undefined, { minimumFractionDigits: 2 })} BDT</p>
                        </div>
                        <div className="h-5 w-px bg-white/10" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{trx.method}</p>
                    </div>
                </div>
            </div>

            {/* P2P Flow Body */}
            <div className="mt-10 pt-8 border-t border-white/5 space-y-6">
                {trx.status === 'pending_instructions' && (
                    <div className="flex gap-3">
                        <input 
                            type="text" 
                            placeholder="Enter Bkash/Nagad Number..."
                            value={adminMsg}
                            onChange={(e) => setAdminMsg(e.target.value)}
                            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                        />
                        <button 
                            disabled={loading}
                            onClick={handleProvideInstructions}
                            className="px-8 py-4 bg-[#D4AF37] text-black rounded-2xl font-black text-[10px] uppercase shadow-xl shadow-[#D4AF37]/20 active:scale-95 transition-all"
                        >
                            {loading ? 'SENDING...' : 'SEND NUMBER'}
                        </button>
                    </div>
                )}

                {trx.status === 'final_review' && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-3xl p-5 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">User Payment TxID</p>
                            <p className="text-xl font-black text-white selection:bg-blue-500/30 font-mono tracking-tighter">{trx.proofTxID || 'No TxID'}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                    </div>
                )}

                {/* [FIX] Display User Payment Details (Account Number) for Withdrawals */}
                {trx.recipientDetails && (
                    <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1">User Payment Details</p>
                            <p className="text-sm font-black text-white tracking-tighter">{trx.recipientDetails}</p>
                        </div>
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(trx.recipientDetails);
                                toast.success('Details Copied!');
                            }}
                            className="p-3 bg-[#D4AF37]/20 rounded-xl hover:bg-[#D4AF37]/30 transition-colors"
                        >
                            <span className="text-lg">📋</span>
                        </button>
                    </div>
                )}

                {/* Metadata Footer */}
                <div className="flex flex-wrap gap-6 text-[10px] font-black uppercase tracking-widest text-slate-600">
                    <div className="flex items-center gap-2">
                        <span className="text-slate-800">Ref ID:</span>
                        <span className="text-slate-500">{trx.transactionId || trx._id?.slice(-8)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-800">Timestamp:</span>
                        <span className="text-slate-500">{new Date(trx.createdAt).toLocaleString()}</span>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex gap-4 pt-4">
                    <button 
                        onClick={() => onView ? onView(trx) : onApprove(trx)}
                        className="flex-1 px-8 py-5 bg-white/5 hover:bg-white/10 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all border border-white/5 active:scale-95"
                    >
                        Review Full Assets
                    </button>
                    
                    {trx.status === 'final_review' && (
                        <button 
                            onClick={() => onApprove(trx)}
                            className="flex-1 px-8 py-5 bg-emerald-500 text-black rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/30 active:scale-95 transition-all"
                        >
                            Confirm & Credit
                        </button>
                    )}

                    {(trx.status === 'pending' || trx.status === 'pending_instructions') && (
                        <button 
                            onClick={() => onReject(trx)}
                            className="px-8 py-5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all border border-red-500/20"
                        >
                            Reject
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
