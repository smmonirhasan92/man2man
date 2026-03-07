'use client';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import Link from 'next/link';
import { Save, Settings, DollarSign, Activity, ArrowLeft, TrendingUp, Plus, Trash2 } from 'lucide-react';

export default function GlobalSettingsPage() {
    const [settings, setSettings] = useState({
        task_base_reward: '',
        daily_task_limit: '',
        min_withdraw_amount: '',
        referral_bonus_amount: '',
        referral_reward_currency: 'income',
        cash_out_commission_percent: '',
        p2p_market_min: '',
        p2p_market_max: '',
        referral_tiers: []
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/admin/settings/global');
            const data = res.data;
            if (typeof data.referral_tiers === 'string') {
                try {
                    data.referral_tiers = JSON.parse(data.referral_tiers);
                } catch (e) {
                    data.referral_tiers = [];
                }
            }
            setSettings(data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/admin/settings/global', settings);
            setMessage('Settings Saved Successfully!');
        } catch (err) {
            console.error(err);
            setMessage('Failed to save settings.');
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleAddTier = () => {
        setSettings(prev => ({
            ...prev,
            referral_tiers: [...(prev.referral_tiers || []), { level: (prev.referral_tiers?.length || 0) + 1, name: '', targetReferrals: 0, bonusAmount: 0 }]
        }));
    };

    const handleUpdateTier = (index, field, value) => {
        const newTiers = [...settings.referral_tiers];
        newTiers[index][field] = value;
        setSettings({ ...settings, referral_tiers: newTiers });
    };

    const handleRemoveTier = (index) => {
        const newTiers = settings.referral_tiers.filter((_, i) => i !== index);
        // re-index levels to maintain order
        newTiers.forEach((t, i) => t.level = i + 1);
        setSettings({ ...settings, referral_tiers: newTiers });
    };

    return (
        <div className="p-6">
            <div className="mb-6 flex items-center gap-4">
                <Link href="/admin/dashboard" className="p-2 bg-slate-200 rounded-full hover:bg-slate-300 transition">
                    <ArrowLeft className="w-5 h-5 text-slate-700" />
                </Link>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Settings className="w-8 h-8 text-indigo-600" />
                    System Control & Settings
                </h1>
            </div>

            {message && (
                <div className={`p-4 rounded-xl mb-6 font-bold ${message.includes('Success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message}
                </div>
            )}

            {loading ? (
                <div className="text-center text-slate-400 py-10">Loading Settings...</div>
            ) : (
                <form onSubmit={handleSave} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-4xl">

                    {/* Task Settings Section Removed - Controlled by Packages/Tiers */}


                    {/* Financial Settings Section */}
                    <div className="mb-8">
                        <h2 className="text-lg font-bold text-slate-700 border-b pb-2 mb-4 flex items-center gap-2">
                            <DollarSign className="w-5 h-5" /> Financial Controls
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-2">Min Withdraw Amount</label>
                                <input
                                    type="number"
                                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={settings.min_withdraw_amount}
                                    onChange={e => setSettings({ ...settings, min_withdraw_amount: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-2">Referral Bonus (Fixed Amount)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={settings.referral_bonus_amount}
                                    onChange={e => setSettings({ ...settings, referral_bonus_amount: e.target.value })}
                                    required
                                />
                                <p className="text-xs text-slate-400 mt-1">Bonus given to referrer per invite.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-2 font-sans">Referral Bonus Destination</label>
                                <select
                                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                                    value={settings.referral_reward_currency || 'income'}
                                    onChange={e => setSettings({ ...settings, referral_reward_currency: e.target.value })}
                                >
                                    <option value="income">Income Wallet (Withdrawable)</option>
                                    <option value="purchase">Purchase Wallet (Shopping Only)</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1 font-sans">Select which wallet receives the referral bonus.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-2">Agent Cash Out Commission (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={settings.cash_out_commission_percent}
                                    onChange={e => setSettings({ ...settings, cash_out_commission_percent: e.target.value })}
                                    required
                                />
                                <p className="text-xs text-slate-400 mt-1">Extra profit % given to Agent when they process a Cash Out.</p>
                            </div>
                        </div>
                    </div>

                    {/* P2P Market Controls Section */}
                    <div className="mb-8">
                        <h2 className="text-lg font-bold text-slate-700 border-b pb-2 mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" /> P2P Market Controls
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-2">P2P Chart Minimum Price (USD)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={settings.p2p_market_min}
                                    onChange={e => setSettings({ ...settings, p2p_market_min: e.target.value })}
                                />
                                <p className="text-xs text-slate-400 mt-1">The lowest simulated value for the P2P random chart.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-2">P2P Chart Maximum Price (USD)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={settings.p2p_market_max}
                                    onChange={e => setSettings({ ...settings, p2p_market_max: e.target.value })}
                                />
                                <p className="text-xs text-slate-400 mt-1">The highest simulated value for the P2P random chart.</p>
                            </div>
                        </div>
                    </div>


                    {/* Tier & Auto-Promotion Section */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between border-b pb-2 mb-4">
                            <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                                <Activity className="w-5 h-5" /> Referral Promotional Tiers
                            </h2>
                            <button
                                type="button"
                                onClick={handleAddTier}
                                className="flex items-center gap-1 bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-indigo-200 transition shadow-sm"
                            >
                                <Plus className="w-4 h-4" /> Add Tier
                            </button>
                        </div>

                        <div className="space-y-4">
                            {(settings.referral_tiers || []).map((tier, index) => (
                                <div key={index} className="flex flex-col md:flex-row gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 items-start md:items-center relative group shadow-sm transition-all hover:border-indigo-300">
                                    <div className="w-full md:w-1/3">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Tier Name</label>
                                        <input
                                            type="text"
                                            className="w-full p-2.5 bg-white rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
                                            placeholder="e.g. Gold"
                                            value={tier.name}
                                            onChange={e => handleUpdateTier(index, 'name', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="w-full md:w-1/3">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Target Referrals</label>
                                        <input
                                            type="number"
                                            className="w-full p-2.5 bg-white rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-slate-800"
                                            value={tier.targetReferrals}
                                            onChange={e => handleUpdateTier(index, 'targetReferrals', parseInt(e.target.value) || 0)}
                                            required
                                        />
                                    </div>
                                    <div className="w-full md:w-1/3">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">Bonus Reward (USD)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full p-2.5 bg-white rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-emerald-600 font-black"
                                            value={tier.bonusAmount}
                                            onChange={e => handleUpdateTier(index, 'bonusAmount', parseFloat(e.target.value) || 0)}
                                            required
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTier(index)}
                                        className="absolute -top-3 -right-3 md:top-auto md:right-0 md:relative p-2 bg-white text-red-500 border border-red-200 rounded-full hover:bg-red-500 hover:text-white hover:border-red-500 transition shadow-sm md:ml-2"
                                        title="Remove Tier"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {(!settings.referral_tiers || settings.referral_tiers.length === 0) && (
                                <div className="text-center p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                                    <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-slate-500 font-medium">No promotional tiers created.</p>
                                    <p className="text-sm text-slate-400">Click "Add Tier" to start rewarding your top inviters.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg disabled:opacity-50 flex items-center gap-2"
                        >
                            <Save className="w-5 h-5" />
                            {saving ? 'Saving...' : 'Update Settings'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
