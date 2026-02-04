'use client';
import { useState, useEffect } from 'react';
import { Save, AlertTriangle, Activity } from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

export default function GameControlPanel() {
    const [settings, setSettings] = useState({
        house_edge: 4,
        min_bet: 10,
        max_bet: 1000,
        global_profit_margin: 10,
        streak_threshold: 3,
        streak_multiplier: 1.5,
        game_status: 'active'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/settings/global').then(res => {
            const data = res.data;
            // Parse strings to numbers where needed or keep as string for input
            setSettings(prev => ({ ...prev, ...data }));
            setLoading(false);
        }).catch(err => console.error(err));
    }, []);

    const handleChange = (e) => {
        setSettings({ ...settings, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        try {
            await api.post('/settings/global', settings);
            await api.post('/settings/global', settings);
            toast.success('Game Settings Updated!');
        } catch (err) {
            toast.error('Failed to update settings');
        }
    };

    if (loading) return <div>Loading Controls...</div>;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                <Activity className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-slate-800">Game Logic Control</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Profit Margin (House Edge) */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="block text-sm font-bold text-slate-700 mb-2">House Edge (%)</label>
                    <div className="flex items-center gap-4">
                        <input
                            type="range" min="0" max="20" step="0.5"
                            name="house_edge" value={settings.house_edge} onChange={handleChange}
                            className="w-full accent-blue-600"
                        />
                        <span className="font-mono font-bold w-12 text-right">{settings.house_edge}%</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Percentage the system statistically retains.</p>
                </div>

                {/* Secure Profit Margin (Pool) */}
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <label className="block text-sm font-bold text-green-800 mb-2">Global Profit Guarantee (%)</label>
                    <div className="flex items-center gap-4">
                        <input
                            type="range" min="1" max="50" step="1"
                            name="global_profit_margin" value={settings.global_profit_margin} onChange={handleChange}
                            className="w-full accent-green-600"
                        />
                        <span className="font-mono font-bold w-12 text-right text-green-700">{settings.global_profit_margin}%</span>
                    </div>
                    <p className="text-xs text-green-600 mt-2">System ensures payouts never exceed (TotalBets - This%).</p>
                </div>

                {/* Bet Limits */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Min Bet (৳)</label>
                    <input type="number" name="min_bet" value={settings.min_bet} onChange={handleChange} className="w-full p-2 border rounded-lg bg-slate-50" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Max Bet (৳)</label>
                    <input type="number" name="max_bet" value={settings.max_bet} onChange={handleChange} className="w-full p-2 border rounded-lg bg-slate-50" />
                </div>

                {/* Streak Logic */}
                <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-purple-50 p-4 rounded-xl border border-purple-200">
                    <div className="col-span-2 text-purple-900 font-bold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Streak Control (Hook Logic)
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-purple-800 mb-1">Win Streak Threshold</label>
                        <input type="number" name="streak_threshold" value={settings.streak_threshold} onChange={handleChange} className="w-full p-2 border border-purple-200 rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-purple-800 mb-1">Bonus Multiplier</label>
                        <input type="number" name="streak_multiplier" value={settings.streak_multiplier} onChange={handleChange} className="w-full p-2 border border-purple-200 rounded-lg" />
                    </div>
                </div>

                {/* Emergency Stop */}
                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Game Status</label>
                    <select name="game_status" value={settings.game_status} onChange={handleChange} className="w-full p-3 rounded-xl border bg-white font-bold">
                        <option value="active">Active (Running)</option>
                        <option value="maintenance">Maintenance (Under Repair)</option>
                        <option value="paused">Paused (No Bets)</option>
                    </select>
                </div>
            </div>

            <div className="mt-8">
                <Button onClick={handleSubmit} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
                    <Save className="w-4 h-4 mr-2" /> Save Game Config
                </Button>
            </div>
        </div>
    );
}
