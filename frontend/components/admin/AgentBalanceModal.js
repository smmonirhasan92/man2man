import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function AgentBalanceModal({ isOpen, onClose, onSubmit, initialAgentId }) {
    const [form, setForm] = useState({ agentId: initialAgentId, type: 'credit', amount: '', note: '' });

    useEffect(() => {
        if (initialAgentId) {
            setForm(prev => ({ ...prev, agentId: initialAgentId }));
        }
    }, [initialAgentId]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(form);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Manage Balance</h2>
                    <button onClick={onClose}><X className="w-6 h-6 text-gray-400" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <button type="button" onClick={() => setForm({ ...form, type: 'credit' })} className={`p-3 rounded-xl font-bold border ${form.type === 'credit' ? 'bg-green-100 border-green-500 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                            Send Money (Credit)
                        </button>
                        <button type="button" onClick={() => setForm({ ...form, type: 'debit' })} className={`p-3 rounded-xl font-bold border ${form.type === 'debit' ? 'bg-red-100 border-red-500 text-red-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                            Collect Cash (Debit)
                        </button>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Amount</label>
                        <input type="number" placeholder="0.00" className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 text-2xl font-bold" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Note (Optional)</label>
                        <input type="text" placeholder="Reason for adjustment..." className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-indigo-500" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
                    </div>

                    <button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-black transition mt-4 shadow-xl shadow-slate-200">
                        {form.type === 'credit' ? 'Send to Agent' : 'Collect from Agent'}
                    </button>
                </form>
            </div>
        </div>
    );
}
