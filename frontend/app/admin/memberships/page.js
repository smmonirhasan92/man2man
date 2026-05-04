'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../services/api';
import { ArrowLeft, Plus, Edit, Trash2, Crown, Check, X, Shield, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';

export default function AdminMembershipsPage() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false });
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        unlock_price: 0,
        validity_days: 30,
        type: 'vip'
    });

    const fetchPlans = async () => {
        try {
            const res = await api.get('/plan');
            setPlans(res.data.filter(p => p.type === 'vip'));
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    useEffect(() => { fetchPlans(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, type: 'vip' };
            if (formData.id) await api.put(`/plan/${formData.id}`, payload);
            else await api.post('/plan', payload);
            toast.success('Membership saved');
            fetchPlans();
            setShowForm(false);
        } catch (err) {
            toast.error('Failed to save');
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen pb-20">
            <div className="bg-amber-500 text-white p-8 rounded-b-[2.5rem] shadow-xl mb-8 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                        <Link href="/admin/dashboard" className="p-3 bg-white/20 backdrop-blur-md rounded-2xl hover:bg-white/30 transition">
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </Link>
                        <button onClick={() => { setFormData({ id: null, name: '', unlock_price: 0, validity_days: 30, type: 'vip' }); setShowForm(true); }} className="bg-white text-amber-600 px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest shadow-xl">
                            + NEW MEMBERSHIP
                        </button>
                    </div>
                    <h1 className="text-4xl font-black mb-2 tracking-tight">PREMIUM PLAYER LEVELS</h1>
                    <p className="text-amber-100/80 text-sm font-medium uppercase tracking-widest">Bypass Age Restrictions (Silver/Gold/Platinum)</p>
                </div>
            </div>

            <div className="px-6 space-y-4">
                {plans.map(plan => (
                    <div key={plan.id || plan._id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600">
                                <Crown size={32} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800">{plan.name}</h3>
                                <div className="flex gap-2 mt-1">
                                    <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase">{plan.validity_days} Days Validity</span>
                                    <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase">
                                        {plan.name.includes('Silver') ? 'Unlocks up to $15' : 
                                         plan.name.includes('Gold') ? 'Unlocks up to $30' : 
                                         plan.name.includes('Platinum') ? 'Unlocks up to $60' : 'Custom Unlock'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-black text-slate-900">{plan.unlock_price} NXS</div>
                            <div className="flex gap-2 mt-3 justify-end">
                                <button onClick={() => { setFormData({ ...plan, id: plan._id }); setShowForm(true); }} className="p-2 bg-slate-100 rounded-lg text-slate-500"><Edit size={16}/></button>
                                <button onClick={async () => { if(confirm('Delete?')) { await api.delete(`/plan/${plan._id}`); fetchPlans(); } }} className="p-2 bg-red-100 rounded-lg text-red-500"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <form onSubmit={handleSubmit} className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Manage Membership</h2>
                            <button type="button" onClick={() => setShowForm(false)} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Membership Level</label>
                                <select 
                                    required 
                                    className="w-full p-4 bg-white rounded-2xl border border-slate-200 font-bold outline-none focus:border-amber-500 text-slate-900" 
                                    value={formData.name} 
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                >
                                    <option value="">Select Level</option>
                                    <option value="Silver Membership">Silver Membership (Unlocks $15)</option>
                                    <option value="Gold Membership">Gold Membership (Unlocks $30)</option>
                                    <option value="Platinum Membership">Platinum Membership (Unlocks $60)</option>
                                    <option value="Diamond Membership">Diamond Membership (Unlocks $250)</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Price (NXS)</label>
                                    <input type="number" required className="w-full p-4 bg-white rounded-2xl border border-slate-200 font-bold outline-none focus:border-amber-500 text-slate-900" value={formData.unlock_price} onChange={e => setFormData({...formData, unlock_price: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Validity (Days)</label>
                                    <input type="number" required className="w-full p-4 bg-white rounded-2xl border border-slate-200 font-bold outline-none focus:border-amber-500 text-slate-900" value={formData.validity_days} onChange={e => setFormData({...formData, validity_days: e.target.value})} />
                                </div>
                            </div>
                            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                                <p className="text-[10px] text-amber-700 font-bold uppercase leading-relaxed">
                                    Note: Silver unlocks up to $15 nodes, Gold up to $30, and Platinum up to $60 for new accounts under 30 days.
                                </p>
                            </div>
                        </div>
                        <div className="p-8 bg-slate-50">
                            <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-amber-600 transition shadow-xl">SAVE MEMBERSHIP</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
