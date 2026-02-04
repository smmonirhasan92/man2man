'use client';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import Link from 'next/link';
import { Save, Settings, DollarSign, Activity, ArrowLeft } from 'lucide-react';

export default function GlobalSettingsPage() {
    const [settings, setSettings] = useState({
        task_base_reward: '',
        daily_task_limit: '',
        min_withdraw_amount: '',
        referral_bonus_amount: '',
        referral_reward_currency: 'income',
        silver_requirement: '',
        gold_requirement: '',
        platinum_requirement: '',
        diamond_requirement: '',
        cash_out_commission_percent: ''
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
            setSettings(res.data);
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

                    {/* Tier & Auto-Promotion Section */}
                    <div className="mb-8">
                        <h2 className="text-lg font-bold text-slate-700 border-b pb-2 mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5" /> Auto-Promotion Rules
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-2">Silver Tier Target (Invites)</label>
                                <input
                                    type="number"
                                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={settings.silver_requirement}
                                    onChange={e => setSettings({ ...settings, silver_requirement: e.target.value })}
                                    required
                                />
                                <p className="text-xs text-slate-400 mt-1">Invites needed to become Silver.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-2">Gold Tier Target (Invites)</label>
                                <input
                                    type="number"
                                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={settings.gold_requirement}
                                    onChange={e => setSettings({ ...settings, gold_requirement: e.target.value })}
                                    required
                                />
                                <p className="text-xs text-slate-400 mt-1">Invites needed to become Gold.</p>
                            </div>

                            {/* New Tiers: Platinum & Diamond */}
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-2">Platinum Tier Target (Invites)</label>
                                <input
                                    type="number"
                                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={settings.platinum_requirement}
                                    onChange={e => setSettings({ ...settings, platinum_requirement: e.target.value })}
                                />
                                <p className="text-xs text-slate-400 mt-1">Invites needed to become Platinum.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-2">Diamond Tier Target (Invites)</label>
                                <input
                                    type="number"
                                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={settings.diamond_requirement}
                                    onChange={e => setSettings({ ...settings, diamond_requirement: e.target.value })}
                                />
                                <p className="text-xs text-slate-400 mt-1">Invites needed to become Diamond.</p>
                            </div>
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
