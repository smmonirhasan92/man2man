'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../services/api';
import { ArrowLeft, Plus, Edit, Trash2, Server, Check, X, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminNodesPage() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        daily_limit: 10,
        task_reward: 1.0,
        unlock_price: 100,
        validity_days: 15,
        type: 'server'
    });

    const fetchPlans = async () => {
        try {
            const res = await api.get('/plan');
            setPlans(res.data.filter(p => p.type === 'server' || p.type === 'number'));
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
            if (formData.id) await api.put(`/plan/${formData.id}`, formData);
            else await api.post('/plan', formData);
            toast.success('Node saved');
            fetchPlans();
            setShowForm(false);
        } catch (err) {
            toast.error('Failed to save');
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen pb-20">
            <div className="bg-blue-600 text-white p-8 rounded-b-[2.5rem] shadow-xl mb-8 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                        <Link href="/admin/dashboard" className="p-3 bg-white/20 backdrop-blur-md rounded-2xl hover:bg-white/30 transition">
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </Link>
                        <button onClick={() => { setFormData({ id: null, name: '', daily_limit: 10, task_reward: 1, unlock_price: 100, validity_days: 15, type: 'server' }); setShowForm(true); }} className="bg-white text-blue-600 px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest shadow-xl">
                            + NEW NODE
                        </button>
                    </div>
                    <h1 className="text-4xl font-black mb-2 tracking-tight">USA NODE NETWORK</h1>
                    <p className="text-blue-100/80 text-sm font-medium uppercase tracking-widest">Manage USA Numbers & Task Rewards</p>
                </div>
            </div>

            <div className="px-6 space-y-4">
                {plans.map(plan => (
                    <div key={plan.id || plan._id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600">
                                <Server size={32} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800">{plan.name}</h3>
                                <div className="flex gap-2 mt-1">
                                    <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase">{plan.daily_limit} Tasks/Day</span>
                                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full uppercase">{plan.task_reward} NXS/Task</span>
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
                            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Configure Node</h2>
                            <button type="button" onClick={() => setShowForm(false)} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button>
                        </div>
                        <div className="p-8 space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Node Name (e.g. USA Lite Node)</label>
                                <input type="text" required className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Daily Limit</label>
                                    <input type="number" required className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold outline-none" value={formData.daily_limit} onChange={e => setFormData({...formData, daily_limit: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Reward/Task</label>
                                    <input type="number" step="0.01" required className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold outline-none" value={formData.task_reward} onChange={e => setFormData({...formData, task_reward: e.target.value})} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Price (NXS)</label>
                                    <input type="number" required className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold outline-none" value={formData.unlock_price} onChange={e => setFormData({...formData, unlock_price: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Validity (Days)</label>
                                    <input type="number" required className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold outline-none" value={formData.validity_days} onChange={e => setFormData({...formData, validity_days: e.target.value})} />
                                </div>
                            </div>
                        </div>
                        <div className="p-8 bg-slate-50">
                            <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-xl">SAVE NODE CONFIG</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
