'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Eye, EyeOff, X, Check, AlertCircle, Image, Palette, MoveUp, MoveDown } from 'lucide-react';
import api from '../../../services/api';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
    title: '',
    subtitle: '',
    bgType: 'image',
    bgValue: '',
    btnText: '',
    btnLink: '',
    btnColor: '#10B981',
    order: 0,
    textAnimation: 'fade-up',
    isActive: true
};

const ANIMATION_OPTIONS = ['fade-up', 'slide-left', 'zoom'];
const COLOR_PRESETS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

export default function AdminBannersPage() {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [preview, setPreview] = useState(null);

    useEffect(() => { fetchBanners(); }, []);

    const fetchBanners = async () => {
        try {
            setLoading(true);
            // Fetch all banners including inactive ones for admin
            const res = await api.get('/banners');
            setBanners(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            toast.error('Failed to load banners');
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setForm({ ...EMPTY_FORM, order: banners.length });
        setEditingId(null);
        setShowModal(true);
    };

    const openEdit = (banner) => {
        setForm({ ...banner });
        setEditingId(banner._id);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
    };

    const handleSave = async () => {
        if (!form.title || !form.bgValue) {
            toast.error('Title and Background are required');
            return;
        }
        setSaving(true);
        try {
            if (editingId) {
                await api.put(`/banners/${editingId}`, form);
                toast.success('Banner updated!');
            } else {
                await api.post('/banners', form);
                toast.success('Banner created!');
            }
            closeModal();
            fetchBanners();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id, title) => {
        if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
        try {
            await api.delete(`/banners/${id}`);
            toast.success('Banner deleted');
            fetchBanners();
        } catch (err) {
            toast.error('Delete failed');
        }
    };

    const handleToggle = async (id) => {
        try {
            await api.patch(`/banners/${id}/toggle`);
            fetchBanners();
        } catch (err) {
            toast.error('Toggle failed');
        }
    };

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    return (
        <div className="min-h-screen bg-[#060d1a] text-white p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-widest text-white flex items-center gap-2">
                            <Image className="w-6 h-6 text-indigo-400" /> Slider Manager
                        </h1>
                        <p className="text-slate-400 text-xs mt-1 font-bold">
                            {banners.length} slide{banners.length !== 1 ? 's' : ''} • Changes go live immediately on the homepage
                        </p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-2xl text-sm font-black transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20"
                    >
                        <Plus size={18} /> Add New Slide
                    </button>
                </div>

                {/* Warning if no banners */}
                {!loading && banners.length === 0 && (
                    <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-2xl flex items-center gap-4">
                        <AlertCircle className="w-6 h-6 text-amber-400 shrink-0" />
                        <div>
                            <p className="text-amber-400 font-black text-sm">No banners found</p>
                            <p className="text-amber-400/70 text-xs mt-1">The slider will show default images until you add banners here.</p>
                        </div>
                    </div>
                )}

                {/* Banner Cards */}
                {loading ? (
                    <div className="grid gap-4">
                        {[1,2,3].map(i => (
                            <div key={i} className="bg-[#0f172a] rounded-2xl h-28 animate-pulse border border-white/5"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {banners.sort((a, b) => a.order - b.order).map((banner, idx) => (
                            <div key={banner._id} className={`bg-[#0f172a] border rounded-2xl overflow-hidden transition-all ${banner.isActive ? 'border-white/10' : 'border-white/5 opacity-60'}`}>
                                <div className="flex items-center gap-4 p-4">
                                    {/* Preview Thumbnail */}
                                    <div
                                        className="w-20 h-14 rounded-xl shrink-0 overflow-hidden relative border border-white/10 cursor-pointer"
                                        style={banner.bgType === 'color' ? { backgroundColor: banner.bgValue } : {}}
                                        onClick={() => setPreview(banner)}
                                    >
                                        {banner.bgType === 'image' && (
                                            <img src={banner.bgValue} alt={banner.title} className="w-full h-full object-cover" onError={e => { e.target.style.display='none'; }}/>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                            <Eye className="w-4 h-4 text-white" />
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[9px] font-black text-slate-500 bg-white/5 px-2 py-0.5 rounded uppercase">#{idx + 1}</span>
                                            <h3 className="text-sm font-black text-white truncate">{banner.title}</h3>
                                            {!banner.isActive && <span className="text-[9px] font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded uppercase">Inactive</span>}
                                        </div>
                                        {banner.subtitle && <p className="text-xs text-slate-400 truncate mt-0.5">{banner.subtitle}</p>}
                                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${banner.bgType === 'image' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                                {banner.bgType === 'image' ? '🖼 Image' : '🎨 Color'}
                                            </span>
                                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-white/5 text-slate-400 uppercase">
                                                {banner.textAnimation}
                                            </span>
                                            {banner.btnText && (
                                                <span className="text-[9px] font-bold text-slate-500">
                                                    btn: {banner.btnText} → {banner.btnLink}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => handleToggle(banner._id)}
                                            title={banner.isActive ? 'Deactivate' : 'Activate'}
                                            className={`p-2 rounded-xl transition-all ${banner.isActive ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
                                        >
                                            {banner.isActive ? <Eye size={16}/> : <EyeOff size={16}/>}
                                        </button>
                                        <button
                                            onClick={() => openEdit(banner)}
                                            className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-all"
                                        >
                                            <Edit3 size={16}/>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(banner._id, banner.title)}
                                            className="p-2 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-all"
                                        >
                                            <Trash2 size={16}/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Full Preview Modal */}
            {preview && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
                    <div className="relative w-full max-w-2xl rounded-2xl overflow-hidden aspect-[16/7] shadow-2xl">
                        {preview.bgType === 'image' ? (
                            <img src={preview.bgValue} alt={preview.title} className="w-full h-full object-cover"/>
                        ) : (
                            <div className="w-full h-full" style={{ backgroundColor: preview.bgValue }}></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex flex-col justify-center px-8">
                            <p className="text-white font-black text-xl">{preview.title}</p>
                            {preview.subtitle && <p className="text-white/70 text-sm mt-1">{preview.subtitle}</p>}
                            {preview.btnText && (
                                <div className="mt-3">
                                    <span className="px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: preview.btnColor }}>
                                        {preview.btnText}
                                    </span>
                                </div>
                            )}
                        </div>
                        <button className="absolute top-3 right-3 bg-black/50 p-1.5 rounded-full text-white hover:bg-black/80 transition-all">
                            <X size={16}/>
                        </button>
                    </div>
                </div>
            )}

            {/* Create / Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-[#0f172a] border border-white/10 rounded-[2rem] w-full max-w-xl shadow-2xl my-4">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <h2 className="text-white font-black text-lg uppercase tracking-widest">
                                {editingId ? 'Edit Slide' : 'New Slide'}
                            </h2>
                            <button onClick={closeModal} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
                                <X size={18} className="text-slate-400"/>
                            </button>
                        </div>

                        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">

                            {/* Title */}
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Headline Title *</label>
                                <input
                                    value={form.title}
                                    onChange={e => set('title', e.target.value)}
                                    placeholder="e.g. HIGH-YIELD USA NODES"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>

                            {/* Subtitle */}
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Subtitle</label>
                                <input
                                    value={form.subtitle}
                                    onChange={e => set('subtitle', e.target.value)}
                                    placeholder="e.g. Earn $5.00/day per Active Server"
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>

                            {/* Background Type Toggle */}
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Background Type</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => set('bgType', 'image')}
                                        className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2 ${form.bgType === 'image' ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                                    >
                                        <Image size={14}/> Image URL
                                    </button>
                                    <button
                                        onClick={() => set('bgType', 'color')}
                                        className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2 ${form.bgType === 'color' ? 'bg-purple-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                                    >
                                        <Palette size={14}/> Solid Color
                                    </button>
                                </div>
                            </div>

                            {/* Background Value */}
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">
                                    {form.bgType === 'image' ? 'Image URL *' : 'Color Code *'}
                                </label>
                                <input
                                    value={form.bgValue}
                                    onChange={e => set('bgValue', e.target.value)}
                                    placeholder={form.bgType === 'image' ? 'https://... or /slider_1.png' : '#1e3a5f'}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-bold placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                                {form.bgValue && form.bgType === 'image' && (
                                    <div className="mt-2 h-16 rounded-xl overflow-hidden border border-white/10">
                                        <img src={form.bgValue} alt="preview" className="w-full h-full object-cover" onError={e => e.target.style.opacity='0.2'}/>
                                    </div>
                                )}
                                {form.bgValue && form.bgType === 'color' && (
                                    <div className="mt-2 h-8 rounded-xl border border-white/10" style={{ backgroundColor: form.bgValue }}></div>
                                )}
                            </div>

                            {/* Button Config */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Button Text</label>
                                    <input
                                        value={form.btnText}
                                        onChange={e => set('btnText', e.target.value)}
                                        placeholder="e.g. Explore"
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm font-bold placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Button Link</label>
                                    <input
                                        value={form.btnLink}
                                        onChange={e => set('btnLink', e.target.value)}
                                        placeholder="/marketplace"
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm font-bold placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Button Color */}
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Button Color</label>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {COLOR_PRESETS.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => set('btnColor', c)}
                                            className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${form.btnColor === c ? 'border-white scale-125' : 'border-transparent'}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                    <input
                                        type="color"
                                        value={form.btnColor}
                                        onChange={e => set('btnColor', e.target.value)}
                                        className="w-8 h-8 rounded-full cursor-pointer border-2 border-white/20 bg-transparent"
                                        title="Custom color"
                                    />
                                </div>
                            </div>

                            {/* Animation & Order */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Animation</label>
                                    <select
                                        value={form.textAnimation}
                                        onChange={e => set('textAnimation', e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm font-bold focus:outline-none focus:border-indigo-500 transition-colors"
                                    >
                                        {ANIMATION_OPTIONS.map(a => (
                                            <option key={a} value={a}>{a}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">Display Order</label>
                                    <input
                                        type="number"
                                        value={form.order}
                                        onChange={e => set('order', parseInt(e.target.value) || 0)}
                                        min="0"
                                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm font-bold focus:outline-none focus:border-indigo-500 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Active Toggle */}
                            <div className="flex items-center justify-between bg-black/30 p-4 rounded-xl border border-white/5">
                                <div>
                                    <p className="text-sm font-black text-white">Active Status</p>
                                    <p className="text-xs text-slate-400 mt-0.5">Show this slide on the homepage slider</p>
                                </div>
                                <button
                                    onClick={() => set('isActive', !form.isActive)}
                                    className={`w-12 h-6 rounded-full transition-all relative ${form.isActive ? 'bg-emerald-500' : 'bg-white/10'}`}
                                >
                                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${form.isActive ? 'left-7' : 'left-1'}`}></span>
                                </button>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-white/10 flex gap-3">
                            <button
                                onClick={closeModal}
                                className="flex-1 py-3 rounded-xl bg-white/5 text-slate-400 font-black text-sm hover:bg-white/10 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                ) : (
                                    <Check size={16}/>
                                )}
                                {saving ? 'Saving...' : editingId ? 'Update Slide' : 'Create Slide'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
