import React from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

export default function ApprovalModal({
    show,
    onClose,
    onConfirm,
    bonusAmount,
    setBonusAmount,
    adminComment,
    setAdminComment,
    receivedAgent,
    setReceivedAgent,
    agents
}) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white p-6 rounded-[2rem] shadow-2xl w-full max-w-sm scale-100 animate-in zoom-in-95 duration-200">
                <h3 className="text-xl font-bold mb-1 text-slate-800">Approve Request</h3>
                <p className="text-xs text-slate-50 mb-6">Confirm transaction details</p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Bonus Amount</label>
                        <div className="relative">
                            <span className="absolute left-4 top-3.5 text-slate-400 font-bold">৳</span>
                            <input
                                type="number"
                                className="w-full bg-slate-50 border border-slate-200 p-3 pl-8 rounded-xl text-slate-800 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none font-bold transition-all"
                                placeholder="0.00"
                                value={bonusAmount}
                                onChange={(e) => setBonusAmount(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Received By Agent (Optional)</label>
                        <div className="relative">
                            <select
                                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-slate-700 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none appearance-none font-medium transition-all"
                                value={receivedAgent}
                                onChange={(e) => setReceivedAgent(e.target.value)}
                            >
                                <option value="">-- Direct / Bank --</option>
                                {agents.map(a => <option key={a._id} value={a._id}>{a.fullName} ({a.phone})</option>)}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Admin Comment</label>
                        <div className="bg-white rounded-xl overflow-hidden border border-slate-200 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-500/20 transition-all">
                            <ReactQuill
                                theme="snow"
                                value={adminComment}
                                onChange={setAdminComment}
                                className="h-24 mb-10"
                                modules={{
                                    toolbar: false
                                }}
                                placeholder="Add a note..."
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-200 active:scale-95 transition-all"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}
