'use client';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useNotification } from '../../../context/NotificationContext';
import { Trash2, Plus, ExternalLink, Play } from 'lucide-react';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';

export default function AdsAdmin() {
    const { showSuccess, showError } = useNotification();
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        url: '',
        duration: 15,
        type: 'ad_view',
        priority: 0
    });
    const [confirmModal, setConfirmModal] = useState({ isOpen: false });

    useEffect(() => {
        fetchAds();
    }, []);

    const fetchAds = async () => {
        try {
            const res = await api.get('/admin/ads');
            setAds(res.data);
        } catch (err) {
            showError('Failed to fetch ads');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/ads', formData);
            showSuccess('Ad Created Successfully');
            setShowForm(false);
            setFormData({ title: '', url: '', duration: 15, type: 'ad_view', priority: 0 });
            fetchAds();
        } catch (err) {
            showError('Failed to create ad');
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
                    await api.delete(`/admin/ads/${id}`);
                    showSuccess('Ad Deleted');
                    fetchAds();
                    setConfirmModal({ isOpen: false });
                } catch (err) {
                    showError('Failed to delete ad');
                }
            }
        });
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-gray-900 p-6 rounded-xl border border-gray-800">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Task Ads Management</h1>
                    <p className="text-gray-400">Manage video ads and websites for the TV Player</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-6 py-2.5 rounded-lg transition-all font-semibold shadow-lg shadow-indigo-500/20"
                >
                    <Plus size={18} />
                    {showForm ? 'Cancel' : 'Add New Ad'}
                </button>
            </div>

            {showForm && (
                <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 animate-in slide-in-from-top-4">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Ad Title</label>
                            <input
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g. Watch Partner Video"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Target URL (Embed/Page)</label>
                            <input
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={formData.url}
                                onChange={e => setFormData({ ...formData, url: e.target.value })}
                                placeholder="https://..."
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Duration (Seconds)</label>
                            <input
                                type="number"
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={formData.duration}
                                onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                min="5"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Type</label>
                            <select
                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="ad_view">Website View</option>
                                <option value="video">Video Ad</option>
                            </select>
                        </div>
                        <div className="md:col-span-2 pt-4">
                            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-lg font-bold shadow-lg shadow-green-900/20 transition-all">
                                Save Ad Campaign
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {ads.map(ad => (
                    <div key={ad._id} className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4 hover:border-gray-700 transition-colors group">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-indigo-400 group-hover:text-white transition-colors">
                                {ad.type === 'video' ? <Play size={20} /> : <ExternalLink size={20} />}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{ad.title}</h3>
                                <p className="text-sm text-gray-400 font-mono truncate max-w-md">{ad.url}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                            <div className="text-center">
                                <span className="block text-xs text-gray-500 uppercase tracking-wider">Duration</span>
                                <span className="font-mono text-xl font-bold text-yellow-500">{ad.duration}s</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-xs text-gray-500 uppercase tracking-wider">Type</span>
                                <span className="px-3 py-1 bg-gray-800 rounded-full text-xs font-bold text-gray-300">{ad.type}</span>
                            </div>
                            <button
                                onClick={() => handleDelete(ad._id)}
                                className="p-2 hover:bg-red-500/10 text-gray-500 hover:text-red-500 rounded-lg transition-colors"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                ))}

                {ads.length === 0 && !loading && (
                    <div className="text-center py-20 text-gray-500 bg-gray-900/50 rounded-xl border border-dashed border-gray-800">
                        <p>No active ads found. Users will see default system ads.</p>
                    </div>
                )}
            </div>
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
