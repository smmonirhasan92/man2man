'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../services/api';
import { ArrowLeft, Plus, Edit, Trash2, Crown, Check, X, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';

export default function AdminPlansPage() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false });
    const [formData, setFormData] = useState({
        id: null,
        name: '',
        daily_limit: 5,
        task_reward: 2.00,
        unlock_price: 0,
        validity_days: 365,
        reward_multiplier: 1.00 // Added Default
    });

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await api.get('/admin/tiers');
            setPlans(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Ensure types
            const payload = {
                ...formData,
                daily_limit: parseInt(formData.daily_limit),
                task_reward: parseFloat(formData.task_reward),
                unlock_price: parseFloat(formData.unlock_price),
                validity_days: parseInt(formData.validity_days),
                reward_multiplier: parseFloat(formData.reward_multiplier)
            };

            await api.post('/admin/tiers', payload);
            fetchPlans();
            setShowForm(false);
            setFormData({ id: null, name: '', daily_limit: 5, task_reward: 2, unlock_price: 0, validity_days: 365, reward_multiplier: 1.00 });
            toast.success('Plan saved successfully');
        } catch (err) {
            console.error(err);
            toast.error('Failed to save plan');
        }
    };

    const editPlan = (plan) => {
        setFormData(plan);
        setShowForm(true);
    };

    const deletePlan = (id) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Plan',
            message: 'Are you sure you want to delete this plan?',
            confirmText: 'Delete',
            onConfirm: async () => {
                try {
                    await api.delete(`/admin/tiers/${id}`);
                    fetchPlans();
                    toast.success('Plan deleted');
                    setConfirmModal({ isOpen: false });
                } catch (err) {
                    console.error(err);
                    toast.error('Failed to delete plan');
                }
            }
        });
    };

    return (
        <div className="bg-slate-50 min-h-screen pb-20">
            {/* PWA Header - Mobile Flow Style */}
            <div className="bg-slate-900 text-white p-6 rounded-b-[2rem] shadow-lg mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-pink-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 -ml-20 -mb-20"></div>

                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                        <Link href="/admin/dashboard" className="p-2 bg-white/10 backdrop-blur-md rounded-xl hover:bg-white/20 transition">
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </Link>
                        <button
                            onClick={() => {
                                setFormData({ id: null, name: '', daily_limit: 5, task_reward: 2, unlock_price: 0, validity_days: 365, reward_multiplier: 1.00 });
                                setShowForm(true);
                            }}
                            className="bg-purple-500 hover:bg-purple-600 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition"
                        >
                            <Plus className="w-3 h-3" /> ADD PLAN
                        </button>
                    </div>

                    <h1 className="text-3xl font-bold mb-1">Account Tiers</h1>
                    <p className="text-slate-400 text-sm">Configure task limits & rewards</p>
                </div>
            </div>

            {/* Plans List - Stacked Flow */}
            <div className="px-6 space-y-4">
                {plans.map(plan => (
                    <div
                        key={plan.id}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative overflow-hidden group"
                    >
                        {/* Color Strip */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${plan.name === 'VIP' ? 'bg-amber-400' :
                            plan.name === 'Premium' ? 'bg-purple-500' : 'bg-slate-300'
                            }`}></div>

                        <div className="flex justify-between items-start">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl bg-slate-50 ${plan.name === 'VIP' ? 'text-amber-500' :
                                    plan.name === 'Premium' ? 'text-purple-600' : 'text-slate-500'
                                    }`}>
                                    <Crown className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">{plan.name}</h3>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-medium">
                                            {plan.daily_limit} Limit
                                        </span>
                                        <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-md font-medium">
                                            ৳{plan.task_reward} /Task
                                        </span>
                                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-medium">
                                            {plan.validity_days} Days
                                        </span>
                                        {plan.reward_multiplier > 1 && (
                                            <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-md font-medium">
                                                {plan.reward_multiplier}x Reward
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2">
                                        Max Earn: ৳{(plan.daily_limit * (plan.task_reward * (plan.reward_multiplier || 1)) * plan.validity_days).toFixed(0)}
                                    </p>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-xl font-bold text-slate-900">
                                    {plan.unlock_price > 0 ? `৳${plan.unlock_price}` : 'Free'}
                                </div>
                                <div className="flex gap-2 mt-4 justify-end">
                                    <button
                                        onClick={() => editPlan(plan)}
                                        className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-500 transition"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => deletePlan(plan.id)}
                                        className="p-2 bg-red-50 hover:bg-red-100 rounded-lg text-red-500 transition"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Form */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
                    <form
                        onSubmit={handleSubmit}
                        className="bg-white rounded-t-[2rem] md:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up md:animate-none"
                    >
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-xl text-slate-800">{formData.id ? 'Edit Plan' : 'New Plan'}</h3>
                            <button onClick={() => setShowForm(false)} type="button" className="p-2 bg-slate-100 rounded-full"><X className="w-5 h-5 text-slate-500" /></button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Plan Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. VIP Gold"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Daily Limit</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900"
                                        value={formData.daily_limit}
                                        onChange={e => setFormData({ ...formData, daily_limit: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Reward (৳)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        className="w-full mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900"
                                        value={formData.task_reward}
                                        onChange={e => setFormData({ ...formData, task_reward: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Multiplier (x)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        className="w-full mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900"
                                        value={formData.reward_multiplier}
                                        onChange={e => setFormData({ ...formData, reward_multiplier: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Validity (Days)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900"
                                        value={formData.validity_days}
                                        onChange={e => setFormData({ ...formData, validity_days: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase">Price (৳)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    className="w-full mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-purple-500 font-bold text-slate-900"
                                    value={formData.unlock_price}
                                    onChange={e => setFormData({ ...formData, unlock_price: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 flex gap-3">
                            <button
                                type="submit"
                                className="w-full py-4 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-lg shadow-purple-200 transition flex items-center justify-center gap-2"
                            >
                                <Check className="w-5 h-5" /> Save Plan
                            </button>
                        </div>
                    </form>
                </div>
            )}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
            />
        </div>
    );
}
