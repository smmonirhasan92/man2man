'use client';
import { useState, useEffect } from 'react';
import { RefreshCw, Save, ShieldAlert, TrendingUp, DollarSign, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';
import api from '@/services/api';

export default function AdminWarRoom() {
    const [stats, setStats] = useState({});
    const [settings, setSettings] = useState({});
    const [lockedUsers, setLockedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false });

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            const [statsRes, settingsRes, lockedRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/settings'),
                api.get('/admin/locked-users')
            ]);
            setStats(statsRes.data);
            setSettings(settingsRes.data);
            setLockedUsers(lockedRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSettingChange = (key, val) => {
        setSettings(prev => ({ ...prev, [key]: val }));
    };

    const saveSettings = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Apply Config',
            message: 'Apply global setting changes? This affects all live games instantly.',
            confirmText: 'Deploy Changes',
            onConfirm: async () => {
                try {
                    await api.post('/admin/settings', settings);
                    toast.success('Settings Applied Successfully to War Room');
                    fetchAll();
                    setConfirmModal({ isOpen: false });
                } catch (e) {
                    toast.error('Failed to save settings');
                }
            }
        });
    };

    if (loading) return <div className="p-10 text-center text-white">Loading War Room...</div>;

    return (
        <div className="min-h-screen bg-slate-900 text-white p-6 pb-20">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 uppercase tracking-tighter">
                        War Room
                    </h1>
                    <p className="text-slate-400 text-sm">Global Command Center</p>
                </div>
                <button onClick={fetchAll} className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition">
                    <RefreshCw className="w-5 h-5 text-slate-300" />
                </button>
            </header>

            {/* Financial Health Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <MetricCard
                    label="Total Bets"
                    value={`৳${stats.totalBets?.toLocaleString()}`}
                    icon={<TrendingUp className="text-blue-400" />}
                    color="bg-blue-500/10 border-blue-500/20"
                />
                <MetricCard
                    label="Total Payouts"
                    value={`৳${stats.totalPayouts?.toLocaleString()}`}
                    icon={<DollarSign className="text-red-400" />}
                    color="bg-red-500/10 border-red-500/20"
                />
                <MetricCard
                    label="Vault Balance"
                    value={`৳${stats.vaultBalance?.toLocaleString()}`}
                    icon={<Wallet className="text-purple-400" />}
                    color="bg-purple-500/10 border-purple-500/20"
                />
                <MetricCard
                    label="Net Admin Profit"
                    value={`৳${stats.netProfit?.toLocaleString()}`}
                    icon={<ShieldAlert className={stats.netProfit > 0 ? "text-emerald-400" : "text-red-400"} />}
                    color={stats.netProfit > 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Control Panel */}
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/5">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Save className="w-5 h-5 text-orange-400" /> Control Metrics
                    </h2>
                    <div className="space-y-4">
                        <SettingInput label="Admin Profit Margin (%)" value={settings.global_profit_margin} onChange={v => handleSettingChange('global_profit_margin', v)} />
                        <SettingInput label="Bonus Vault Tax (%)" value={settings.bonus_vault_percent} onChange={v => handleSettingChange('bonus_vault_percent', v)} />
                        <SettingInput label="Turnover Multiplier (x)" value={settings.turnover_multiplier} onChange={v => handleSettingChange('turnover_multiplier', v)} />
                        <SettingInput label="Targeted Winner ID (Audit)" value={settings.targeted_winner_id || ''} onChange={v => handleSettingChange('targeted_winner_id', v)} type="text" />

                        <button onClick={saveSettings} className="w-full py-3 mt-4 bg-orange-600 hover:bg-orange-500 rounded-xl font-bold uppercase tracking-widest transition-all">
                            Deploy Changes
                        </button>
                    </div>
                </div>

                {/* Locked Users */}
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/5">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <ShieldAlert className="w-5 h-5 text-red-400" /> Retention Watchlist
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-slate-400 font-bold uppercase text-xs border-b border-white/10">
                                <tr>
                                    <th className="py-2">User</th>
                                    <th>Required</th>
                                    <th>Remaining</th>
                                    <th>%</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {lockedUsers.map(u => (
                                    <tr key={u.id} className="hover:bg-white/5 transition">
                                        <td className="py-3 font-mono text-slate-300">{u.username}</td>
                                        <td className="text-slate-400">৳{u.required}</td>
                                        <td className="text-red-400 font-bold">৳{u.remaining.toFixed(2)}</td>
                                        <td>
                                            <span className="bg-slate-700 text-xs px-2 py-1 rounded">{u.progress}%</span>
                                        </td>
                                    </tr>
                                ))}
                                {lockedUsers.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="py-8 text-center text-slate-500">No users currently locked.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

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

function MetricCard({ label, value, icon, color }) {
    return (
        <div className={`p-5 rounded-2xl border ${color} flex items-center justify-between`}>
            <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-black mt-1 font-mono tracking-tight">{value}</p>
            </div>
            <div className="p-3 bg-black/20 rounded-xl">
                {icon}
            </div>
        </div>
    );
}

function SettingInput({ label, value, onChange, type = "number" }) {
    return (
        <div>
            <label className="block text-slate-400 text-xs font-bold uppercase mb-1">{label}</label>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 font-mono text-white focus:outline-none focus:border-orange-500 transition-colors"
                placeholder="---"
            />
        </div>
    );
}
