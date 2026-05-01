'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../../services/api';
import { Plus, Trash2, ExternalLink, Image as ImageIcon, ArrowLeft, Pencil, X, Shield, Activity, Target, Clock, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';

export default function AdminTasksPage() {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false });

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        imageUrl: '',
        url: '',
        duration: 15,
        type: 'ad_view'
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchAds();
    }, []);

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
            const payload = { ...formData };
            if (editId) {
                await api.put(`/admin/task-ad/${editId}`, payload);
                toast.success('Task Updated Successfully!');
            } else {
                await api.post('/admin/task-ad', payload);
                toast.success('Task Created Successfully!');
            }
            setFormData({ title: '', imageUrl: '', url: '', duration: 15, type: 'ad_view' });
            setEditId(null);
            setShowForm(false);
            fetchAds();
        } catch (err) {
            console.error(err);
            toast.error('Failed to save task.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (id) => {
        setConfirmModal({
            isOpen: true,
            title: 'Terminate Task',
            message: 'Are you sure you want to permanently remove this task from the ecosystem?',
            confirmText: 'Delete Task',
            onConfirm: async () => {
                try {
                    await api.delete(`/admin/task-ad/${id}`);
                    setAds(ads.filter(ad => (ad._id || ad.id) !== id));
                    toast.success('Task Removed');
                    setConfirmModal({ isOpen: false });
                } catch (err) {
                    console.error(err);
                    toast.error('Failed to delete ad');
                }
            }
        });
    };

    return (
        <div className="min-h-screen bg-[#070b14] text-slate-200 p-6 md:p-10 font-sans relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div className="flex items-center gap-6">
                        <Link href="/admin/dashboard" className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95">
                            <ArrowLeft size={24} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                <h1 className="text-3xl font-black text-white tracking-tight uppercase">Task Protocol</h1>
                            </div>
                            <p className="text-slate-500 text-sm font-bold tracking-widest uppercase">Ecosystem Content Distribution</p>
                        </div>
                    </div>
                    
                    <button
                        onClick={() => { 
                            setShowForm(!showForm); 
                            setEditId(null); 
                            setFormData({ title: '', imageUrl: '', url: '', duration: 15, type: 'ad_view' }); 
                        }}
                        className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black text-sm tracking-widest uppercase transition-all shadow-xl active:scale-95 ${showForm ? 'bg-rose-500 text-white shadow-rose-500/20' : 'bg-indigo-600 text-white shadow-indigo-600/20 hover:bg-indigo-500'}`}
                    >
                        {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                        {showForm ? 'Abort' : 'Deploy New Task'}
                    </button>
                </div>

                {/* Statistics Grid (Quick Glance) */}
                {!showForm && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        <div className="bg-[#0b1221]/80 backdrop-blur-xl border border-white/5 p-6 rounded-3xl">
                            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4 text-indigo-400">
                                <Activity className="w-5 h-5" />
                            </div>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Active Tasks</p>
                            <h3 className="text-2xl font-black text-white">{ads.length}</h3>
                        </div>
                        <div className="bg-[#0b1221]/80 backdrop-blur-xl border border-white/5 p-6 rounded-3xl">
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 text-emerald-400">
                                <Clock className="w-5 h-5" />
                            </div>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Avg. Duration</p>
                            <h3 className="text-2xl font-black text-white">{ads.length > 0 ? (ads.reduce((a, b) => a + (b.duration || 0), 0) / ads.length).toFixed(1) : 0}s</h3>
                        </div>
                        <div className="bg-[#0b1221]/80 backdrop-blur-xl border border-white/5 p-6 rounded-3xl">
                            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4 text-amber-400">
                                <Target className="w-5 h-5" />
                            </div>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Content Diversity</p>
                            <h3 className="text-2xl font-black text-white">{new Set(ads.map(a => a.type)).size} Types</h3>
                        </div>
                        <div className="bg-[#0b1221]/80 backdrop-blur-xl border border-white/5 p-6 rounded-3xl">
                            <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center mb-4 text-rose-400">
                                <Zap className="w-5 h-5" />
                            </div>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">System Load</p>
                            <h3 className="text-2xl font-black text-white">Optimal</h3>
                        </div>
                    </div>
                )}

                {/* Form Section */}
                {showForm && (
                    <div className="bg-[#0b1221]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-12 mb-12 shadow-2xl animate-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                                <Zap className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight uppercase">{editId ? 'Modify Task Protocol' : 'Deploy New Protocol'}</h2>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Configuration Interface</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Task Identification</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-indigo-500 transition-all placeholder-slate-600 shadow-inner"
                                        placeholder="e.g. MISSION: ALPHA CLOUD"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Neural Destination (URL)</label>
                                    <input
                                        type="url"
                                        value={formData.url}
                                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-indigo-500 transition-all placeholder-slate-600 shadow-inner"
                                        placeholder="https://cloud.usa-affiliate.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Visual Asset (Image URL)</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-4 flex items-center text-slate-500 group-focus-within:text-indigo-400">
                                        <ImageIcon className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="url"
                                        value={formData.imageUrl}
                                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white font-bold outline-none focus:border-indigo-500 transition-all placeholder-slate-600 shadow-inner"
                                        placeholder="https://cdn.network/hero.jpg"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Exposure Duration (Seconds)</label>
                                    <input
                                        type="number"
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                                        min="5"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Interaction Model</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer shadow-inner"
                                    >
                                        <option value="ad_view">Visual Scan (Visit)</option>
                                        <option value="video">Stream Analysis (Video)</option>
                                        <option value="review">Feedback Protocol (Review)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row justify-end gap-4 pt-10 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); setEditId(null); }}
                                    className="px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    Cancel Operation
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-12 py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
                                >
                                    {submitting ? 'Processing...' : (editId ? 'Commit Changes' : 'Execute Deployment')}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Tasks List */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-4">
                        <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                        <p className="font-bold tracking-widest uppercase text-xs">Scanning Database...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {ads.map(ad => (
                            <div key={ad._id || ad.id} className="group bg-[#0b1221]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] overflow-hidden hover:border-indigo-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 relative">
                                {/* Badge Overlay */}
                                <div className="absolute top-4 left-4 z-20 flex gap-2">
                                    <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-tighter border border-white/10">
                                        {ad.duration}s
                                    </span>
                                    <span className={`px-3 py-1 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-tighter border ${ad.type === 'video' ? 'bg-rose-500/20 text-rose-400 border-rose-500/20' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20'}`}>
                                        {ad.type}
                                    </span>
                                </div>

                                <div className="h-56 overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b1221] to-transparent z-10 opacity-60"></div>
                                    <img
                                        src={ad.imageUrl || "https://images.unsplash.com/photo-1617704548623-340376564e68?auto=format&fit=crop&q=80&w=800"}
                                        alt={ad.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition duration-1000"
                                    />
                                </div>
                                <div className="p-6 relative">
                                    <h3 className="font-black text-xl text-white mb-2 truncate group-hover:text-indigo-400 transition-colors">{ad.title}</h3>
                                    <p className="text-slate-500 text-xs font-mono mb-6 truncate opacity-70 italic">{ad.url}</p>
                                    
                                    <div className="flex justify-between items-center pt-6 border-t border-white/5">
                                        <a
                                            href={ad.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-slate-400 hover:text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors"
                                        >
                                            <ExternalLink className="w-4 h-4" /> Preview
                                        </a>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setFormData({
                                                        title: ad.title,
                                                        imageUrl: ad.imageUrl || '',
                                                        url: ad.url,
                                                        duration: ad.duration,
                                                        type: ad.type
                                                    });
                                                    setEditId(ad._id || ad.id);
                                                    setShowForm(true);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-all active:scale-95"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(ad._id || ad.id)}
                                                className="w-10 h-10 bg-rose-500/10 text-rose-400 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all active:scale-95"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {ads.length === 0 && (
                            <div className="col-span-full py-24 flex flex-col items-center justify-center bg-[#0b1221]/40 border border-dashed border-white/10 rounded-[3rem]">
                                <ImageIcon className="w-16 h-16 text-slate-800 mb-4" />
                                <h3 className="text-xl font-black text-slate-600 uppercase tracking-widest">No Active Protocols</h3>
                                <p className="text-slate-500 text-sm mt-2">Initialize your first task deployment.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

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
