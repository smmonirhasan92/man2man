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

                {/* [REDESIGNED] Payment Details - Number Shown Prominently */}
                {trx.recipientDetails && (() => {
                    // Parse: "Bkash - Personal (Send Money) - 01987786543 (main wallet)"
                    // or old format: "Bkash - 01987786543 (main wallet)"
                    const parts = trx.recipientDetails.split(' - ');
                    let method = parts[0]?.trim() || '';
                    let accountType = '';
                    let number = '';

                    if (parts.length >= 3) {
                        accountType = parts[1]?.trim() || '';
                        number = parts[2]?.split('(')[0]?.trim() || '';
                    } else {
                        number = parts[1]?.split('(')[0]?.trim() || '';
                    }

                    const isBkash = method.toLowerCase().includes('bkash');
                    const isAgent = accountType.toLowerCase().includes('agent');

                    const doCopy = () => {
                        const copyTarget = number || trx.recipientDetails;
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                            navigator.clipboard.writeText(copyTarget);
                            toast.success('Number Copied!');
                        } else {
                            const el = document.createElement('textarea');
                            el.value = copyTarget;
                            document.body.appendChild(el);
                            el.select();
                            try { document.execCommand('copy'); toast.success('Number Copied!'); }
                            catch { toast.error('Could not copy'); }
                            document.body.removeChild(el);
                        }
                    };

                    return (
                        <div
                            onClick={doCopy}
                            className="cursor-pointer bg-[#D4AF37]/10 border-2 border-[#D4AF37]/30 hover:border-[#D4AF37]/60 rounded-2xl p-5 transition-all active:scale-98 group"
                        >
                            {/* Badges */}
                            <div className="flex items-center gap-2 mb-3">
                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                    isBkash ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                }`}>{method || 'MFS'}</span>
                                {accountType && (
                                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                        isAgent ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    }`}>{isAgent ? 'Cash Out (Agent)' : 'Send Money'}</span>
                                )}
                            </div>
                            {/* The Number - BIG */}
                            <p className="text-3xl font-black text-white tracking-widest mb-2">{number || '—'}</p>
                            {/* Copy hint */}
                            <p className="text-[9px] font-black text-[#D4AF37]/50 uppercase tracking-widest group-hover:text-[#D4AF37]/80 transition-colors">📋 Tap to copy number</p>
                        </div>
                    );
                })()}

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
                    
                    {['pending', 'final_review'].includes(trx.status) && (
                        <button 
                            onClick={() => onApprove(trx)}
                            className="flex-1 px-8 py-5 bg-emerald-500 text-black rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/30 active:scale-95 transition-all"
                        >
                            {trx.type === 'cash_out' || trx.type === 'withdraw' ? 'Approve Cash-out' : 'Confirm & Credit'}
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
