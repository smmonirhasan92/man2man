'use client';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Save, Settings, DollarSign, Percent, Power, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GameSettingsPage() {
    const [settings, setSettings] = useState({
        house_edge: 4,
        winning_percentage: 48,
        min_bet: 10,
        max_bet: 1000,
        game_status: 'active',
        streak_threshold: 3,
        streak_multiplier: 1.5
    });
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/game/settings');
            // Ensure numeric values are numbers
            setSettings({
                ...res.data,
                house_edge: parseFloat(res.data.house_edge),
                winning_percentage: parseFloat(res.data.winning_percentage),
                min_bet: parseInt(res.data.min_bet),
                max_bet: parseInt(res.data.max_bet),
                streak_threshold: parseInt(res.data.streak_threshold),
                streak_multiplier: parseFloat(res.data.streak_multiplier)
            });
        } catch (err) {
            console.error("Failed to fetch settings", err);
            setMessage('Failed to load current settings');
        } finally {
            setFetching(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/game/settings', settings);
            setMessage('Settings Updated Successfully! ✅');
            await fetchSettings(); // Refresh to be sure
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error(err);
            setMessage('Failed to update settings ❌');
        } finally {
            setLoading(false);
        }
    };

    const handleWinChange = (val) => {
        const winPct = parseFloat(val);
        const houseEdge = 100 - (winPct * 2);
        setSettings({ ...settings, winning_percentage: winPct, house_edge: houseEdge.toFixed(2) });
    };

    if (fetching) return <div className="p-8 text-center text-slate-500">Loading Configuration...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-purple-100 rounded-2xl">
                    <Settings className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Game Logic Settings</h1>
                    <p className="text-slate-500">Configure availability, win rates, and limits.</p>
                </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                <form onSubmit={handleUpdate} className="space-y-8">

                    {/* Game Status */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${settings.game_status === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                <Power className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-700">Game Availability</h3>
                                <p className="text-xs text-slate-500">Turn the game on or off instantly.</p>
                            </div>
                        </div>
                        <div className="flex bg-slate-200 p-1 rounded-lg">
                            <button
                                type="button"
                                onClick={() => setSettings({ ...settings, game_status: 'active' })}
                                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${settings.game_status === 'active' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Active
                            </button>
                            <button
                                type="button"
                                onClick={() => setSettings({ ...settings, game_status: 'maintenance' })}
                                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${settings.game_status !== 'active' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Maintenance
                            </button>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100"></div>

                    {/* Winning Percentage & House Edge */}
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-widest">
                                    <Trophy className="w-4 h-4" /> Win Chance %
                                </label>
                                <span className="text-2xl font-black text-purple-600">{settings.winning_percentage}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="50"
                                step="0.5"
                                value={settings.winning_percentage}
                                onChange={(e) => handleWinChange(e.target.value)}
                                className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-purple-600"
                            />
                            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                                <span>0% (Impossible)</span>
                                <span>25% (Hard)</span>
                                <span>50% (Fair)</span>
                            </div>
                        </div>

                        {/* Read Only House Edge Display */}
                        <div className="flex items-center justify-between p-4 bg-yellow-50/50 rounded-xl border border-yellow-100">
                            <span className="text-sm font-bold text-yellow-700 flex items-center gap-2">
                                <Percent className="w-4 h-4" /> Calculated House Edge
                            </span>
                            <span className="font-mono font-bold text-yellow-800">{settings.house_edge}%</span>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100"></div>

                    {/* Bonus Logic Settings */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                <Trophy className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-700">Streak Bonus Logic</h3>
                                <p className="text-xs text-slate-500">Reward users for consecutive wins.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                                    Win Threshold
                                </label>
                                <input
                                    type="number"
                                    value={settings.streak_threshold}
                                    onChange={(e) => setSettings({ ...settings, streak_threshold: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                                <p className="text-[10px] text-slate-400">Wins in a row required (Default: 3)</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                                    Bonus Multiplier
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={settings.streak_multiplier}
                                    onChange={(e) => setSettings({ ...settings, streak_multiplier: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                                <p className="text-[10px] text-slate-400">Payout Multiplier (Default: 1.5x)</p>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-slate-100"></div>

                    {/* Bet Limits */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <DollarSign className="w-4 h-4" /> Min Bet
                            </label>
                            <input
                                type="number"
                                value={settings.min_bet}
                                onChange={(e) => setSettings({ ...settings, min_bet: e.target.value })}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <DollarSign className="w-4 h-4" /> Max Bet
                            </label>
                            <input
                                type="number"
                                value={settings.max_bet}
                                onChange={(e) => setSettings({ ...settings, max_bet: e.target.value })}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="h-px bg-slate-100"></div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-purple-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? 'Saving Configuration...' : <><Save className="w-5 h-5" /> Update System Logic</>}
                    </button>

                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 rounded-xl text-center font-bold ${message.includes('Success') ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600'}`}
                        >
                            {message}
                        </motion.div>
                    )}
                </form>
            </div>
        </div>
    );
}
