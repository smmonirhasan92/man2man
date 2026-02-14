'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../services/api';
import { Plus, Trash2, ExternalLink, Image as ImageIcon, ArrowLeft, Pencil, X } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';

export default function AdminTasksPage() {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null); // [NEW] Track Edit Mode
    const [plans, setPlans] = useState([]); // [NEW] Plan List for Dropdown
    const [confirmModal, setConfirmModal] = useState({ isOpen: false });

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        imageUrl: '',
        url: '',
        reward_amount: '',
        duration: 15,
        type: 'ad_view',
        priority: 0,
        valid_plan_id: '',
        server_id: 'SERVER_01' // [NEW] Default
    });

    // [FIX] Define Server Options
    const serverOptions = Array.from({ length: 10 }, (_, i) => `SERVER_${String(i + 1).padStart(2, '0')}`);


    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchAds();
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const res = await api.get('/admin/tiers');
            setPlans(res.data || []);
        } catch (err) {
            console.error("Failed to load plans", err);
        }
    };

    const fetchAds = async () => {
        try {
            const res = await api.get('/admin/task-ad');
            setAds(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Convert single ID to array for backend
            const payload = { ...formData };
            if (payload.valid_plan_id) {
                payload.valid_plans = [payload.valid_plan_id];
            } else {
                payload.valid_plans = []; // Global
            }
            delete payload.valid_plan_id; // Clean up

            if (editId) {
                await api.put(`/admin/task-ad/${editId}`, payload);
                setMessage('Task Ad Updated Successfully!');
            } else {
                await api.post('/admin/task-ad', payload);
                setMessage('Task Ad Created Successfully!');
            }

            setFormData({ title: '', imageUrl: '', url: '', reward_amount: '', duration: 15, type: 'ad_view', priority: 0, valid_plan_id: '' });
            setEditId(null); // Reset
            setShowForm(false);
            fetchAds();
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error(err);
            setMessage('Failed to save ad.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (id) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Ad',
            message: 'Are you sure you want to delete this ad?',
            confirmText: 'Delete',
            onConfirm: async () => {
                try {
                    await api.delete(`/admin/task-ad/${id}`);
                    setAds(ads.filter(ad => (ad._id || ad.id) !== id));
                    toast.success('Ad deleted');
                    setConfirmModal({ isOpen: false });
                } catch (err) {
                    console.error(err);
                    toast.error('Failed to delete ad');
                }
            }
        });
    };

    return (
        <div className="bg-slate-50 min-h-screen p-8">
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/admin/dashboard" className="p-2 bg-white rounded-xl shadow-sm hover:shadow-md transition text-slate-600">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">Task Management</h1>
                        <p className="text-slate-500 text-sm">Create and manage task advertisements</p>
                    </div>
                </div>
                <button
                    onClick={() => { setShowForm(!showForm); setEditId(null); setFormData({ title: '', imageUrl: '', url: '', reward_amount: '', duration: 15, type: 'ad_view', priority: 0, valid_plan_id: '' }); }}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
                >
                    {showForm ? <X size={20} /> : <Plus size={20} />}
                    {showForm ? 'Close' : 'Add New Task'}
                </button>
            </div>

            {message && (
                <div className="bg-emerald-100 text-emerald-700 p-4 rounded-xl mb-6 border border-emerald-200 font-medium animate-in fade-in slide-in-from-top-2">
                    {message}
                </div>
            )}

            {/* Add/Edit Form */}
            {showForm && (
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 mb-8 animate-in slide-in-from-top-4">
                    <h2 className="text-lg font-bold mb-4">{editId ? 'Edit Task Ad' : 'Create New Task Ad'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Task Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-indigo-500 placeholder-slate-400"
                                    placeholder="e.g. Visit Partner Site"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target URL</label>
                                <input
                                    type="url"
                                    value={formData.url}
                                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                    className="w-full text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-indigo-500 placeholder-slate-400"
                                    placeholder="https://example.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Image URL */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Image URL (Optional)</label>
                            <div className="flex gap-2">
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-400">
                                    <ImageIcon size={20} />
                                </div>
                                <input
                                    type="url"
                                    value={formData.imageUrl}
                                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                    className="w-full text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-indigo-500 placeholder-slate-400"
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">USD Reward ($)</label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    value={formData.reward_amount}
                                    onChange={(e) => setFormData({ ...formData, reward_amount: e.target.value })}
                                    className="w-full text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-indigo-500 font-mono placeholder-slate-400"
                                    placeholder="0.50"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Duration (Sec)</label>
                                <input
                                    type="number"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                    className="w-full text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-indigo-500 placeholder-slate-400"
                                    min="5"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-indigo-500"
                                >
                                    <option value="ad_view">Ad Visit</option>
                                    <option value="video">Video Stream</option>
                                    <option value="review">Product Review</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Priority</label>
                                <input
                                    type="number"
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    className="w-full text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-indigo-500 placeholder-slate-400"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* PLAN SELECTOR [NEW] */}
                        {/* SERVER SELECTOR [NEW] */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Server Group (Strict Routing)</label>
                            <select
                                value={formData.server_id}
                                onChange={(e) => setFormData({ ...formData, server_id: e.target.value })}
                                className="w-full text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-indigo-500"
                            >
                                {serverOptions.map(sid => (
                                    <option key={sid} value={sid}>{sid}</option>
                                ))}
                            </select>
                        </div>

                        {/* PLAN SELECTOR */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assigned Plan (Optional)</label>
                            <select
                                value={formData.valid_plan_id}
                                onChange={(e) => setFormData({ ...formData, valid_plan_id: e.target.value })}
                                className="w-full text-slate-900 bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-indigo-500"
                            >
                                <option value="">Global (All Users)</option>
                                {plans.map(plan => (
                                    <option key={plan._id || plan.id} value={plan._id || plan.id}>
                                        {plan.name} (${plan.price_usd}) - {plan.daily_limit} Tasks
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => { setShowForm(false); setEditId(null); }}
                                className="px-6 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="bg-indigo-600 text-white px-8 py-2 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg disabled:opacity-50"
                            >
                                {submitting ? 'Saving...' : (editId ? 'Update Ad' : 'Create Ad')}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className="text-center py-10 text-slate-400">Loading Ads...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ads.map(ad => (
                        <div key={ad._id || ad.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-lg transition">
                            <div className="h-48 overflow-hidden relative">
                                <img
                                    src={ad.imageUrl}
                                    alt={ad.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                                />
                                <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white px-2 py-1 rounded-lg text-xs font-mono">
                                    P: {ad.priority}
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-lg text-slate-800 mb-1 truncate">{ad.title}</h3>
                                <div className="flex gap-2 mb-3">
                                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">${ad.reward_amount}</span>
                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-mono">{ad.duration}s</span>
                                    <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-xs uppercase">{ad.type}</span>
                                </div>
                                <div className="flex justify-between items-center border-t border-slate-50 pt-3">
                                    <a
                                        href={ad.url}
                                        target="_blank"
                                        className="text-indigo-500 text-sm font-bold flex items-center gap-1 hover:underline"
                                    >
                                        <ExternalLink className="w-4 h-4" /> Link
                                    </a>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setFormData({
                                                    title: ad.title,
                                                    imageUrl: ad.imageUrl || '',
                                                    url: ad.url,
                                                    reward_amount: ad.reward_amount,
                                                    duration: ad.duration,
                                                    type: ad.type,
                                                    priority: ad.priority,
                                                    valid_plan_id: (ad.valid_plans && ad.valid_plans.length > 0) ? ad.valid_plans[0] : ''
                                                });
                                                setEditId(ad._id || ad.id);
                                                setShowForm(true);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            className="text-amber-400 hover:text-amber-600 p-2 hover:bg-amber-50 rounded-lg transition"
                                        >
                                            <Pencil className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(ad._id || ad.id)}
                                            className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {ads.length === 0 && (
                        <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                            <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                            <p className="text-slate-500 font-medium">No Ads Found</p>
                            <p className="text-sm text-slate-400">Click "Add New Ad" to create one.</p>
                        </div>
                    )}
                </div>
            )}
            {/* Confirmation Modal */}
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
