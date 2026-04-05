'use client';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import { ShieldAlert, Activity, Users, Zap, Save, RefreshCw, PowerOff, ArrowUpRight, ArrowDownRight, Globe, Settings } from 'lucide-react';

export default function FinancialControlCenter() {
    // Vault State
    const [vault, setVault] = useState(null);
    const [loading, setLoading] = useState(true);
    const [seedAmount, setSeedAmount] = useState('');
    
    // Config Edits
    const [configEdits, setConfigEdits] = useState({});

    // Live Socket State
    const [traffic, setTraffic] = useState({ visitors: 0, players: { spin: 0, scratch: 0 } });
    const [feed, setFeed] = useState([]);

    useEffect(() => {
        fetchVault();

        // Socket IO configuration
        const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://usaaffiliatemarketing.com';
        const socket = io(BASE_URL + '/system');

        socket.on('connect', () => {
            console.log("Admin Socket connected!");
            socket.emit('join_admin_room', 'dummy_token');
        });

        socket.on('live_traffic_update', (data) => {
            setTraffic({
                visitors: data.visitors || 0,
                players: data.players || { spin: 0, scratch: 0 }
            });
        });

        socket.on('activity_feed', (data) => {
            setFeed(prev => {
                const updated = [data, ...prev];
                if (updated.length > 50) updated.pop();
                return updated;
            });
        });

        return () => socket.disconnect();
    }, []);

    const fetchVault = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/vault');
            setVault(res.data);
            setConfigEdits({
                hardStopLimit: res.data.config.hardStopLimit,
                tightModeThreshold: res.data.config.tightModeThreshold,
                houseEdge: res.data.config.houseEdge || 10,
                isEnabled: res.data.config.isEnabled
            });
        } catch (e) {
            toast.error("Failed to fetch Game Vault");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveConfig = async () => {
        try {
            const res = await api.post('/admin/vault/config', {
                hardStopLimit: configEdits.hardStopLimit,
                tightModeThreshold: configEdits.tightModeThreshold,
                houseEdge: configEdits.houseEdge
            });
            setVault(res.data.vault);
            toast.success("Risk Controls Updated");
        } catch (e) {
            toast.error("Failed to update Risk Controls");
        }
    };

    const handleSeedVault = async (e) => {
        e.preventDefault();
        if (!seedAmount || isNaN(seedAmount) || Number(seedAmount) <= 0) return toast.error("Invalid Amount");
        
        try {
            const res = await api.post('/admin/vault/config', { seedAmount: Number(seedAmount) });
            setVault(res.data.vault);
            setSeedAmount('');
            toast.success("Seed Capital added to Active Pool!");
        } catch(e) {
            toast.error("Failed to seed Vault");
        }
    };

    const toggleKillSwitch = async () => {
        const newStatus = !configEdits.isEnabled;
        if (!confirm(`Are you sure you want to ${newStatus ? 'ENABLE' : 'DISABLE'} the game engine?`)) return;

        try {
            const res = await api.post('/admin/vault/config', { isEnabled: newStatus });
            setVault(res.data.vault);
            setConfigEdits(prev => ({...prev, isEnabled: newStatus}));
            toast.success(`Engine is now ${newStatus ? 'ONLINE' : 'OFFLINE'}`);
        } catch (e) {
            toast.error("Kill Switch Failed");
        }
    };

    const flushCache = async () => {
        if (!confirm("Flush system cache? Active matches will be voided without charging players.")) return;
        try {
            await api.post('/admin/vault/emergency');
            toast.success("Queue cache flushed.");
        } catch (e) {
            toast.error("Flush Cache failed");
        }
    };

    if (loading) return <div className="p-8 text-center text-white">Loading Financial Control Center...</div>;
    if (!vault) return <div className="p-8 text-rose-500 font-bold items-center">Vault Error.</div>;

    const statsObj = vault.stats || { totalBetsIn: 0, totalPayoutsOut: 0 };
    const balancesObj = vault.balances || { adminIncome: 0, activePool: 0, userInterest: 0 };
    const configObj = vault.config || { hardStopLimit: 1000, tightModeThreshold: 3000, houseEdge: 10, isEnabled: false };

    const netPlatform = (statsObj.totalBetsIn || 0) - (statsObj.totalPayoutsOut || 0);

    return (
        <div className="p-6 text-white max-w-7xl mx-auto space-y-6 pb-20">
            <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
                <ShieldAlert className="text-pink-500 w-8 h-8" /> Financial Control Center
            </h1>
            <p className="text-sm text-slate-400 max-w-3xl mb-8">Maintain exact statistical superiority (House Edge) and monitor triple-stream vault metrics in real-time. Use the kill switch for immediate crisis intervention.</p>

            {/* LIVE TRAFFIC DASHBOARD */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Traffic Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900 border border-slate-700 p-5 rounded-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                            <Globe className="w-5 h-5 text-blue-400 mb-2" />
                            <h3 className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Live Visitors</h3>
                            <p className="text-4xl font-black text-white mt-1">{traffic.visitors} <span className="text-[10px] text-blue-400 font-bold ml-1 animate-pulse px-2 py-0.5 bg-blue-500/10 rounded-full">ACTIVE</span></p>
                        </div>
                        <div className="bg-slate-900 border border-slate-700 p-5 rounded-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                            <Activity className="w-5 h-5 text-emerald-400 mb-2" />
                            <h3 className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Active Players (Engine)</h3>
                            <div className="flex gap-4 mt-2">
                                <p className="text-lg font-black text-white">S: <span className="text-emerald-400">{traffic.players.spin || 0}</span></p>
                                <p className="text-lg font-black text-white">X: <span className="text-emerald-400">{traffic.players.scratch || 0}</span></p>
                            </div>
                        </div>
                    </div>

                    {/* TRIPLE STREAM MONITOR */}
                    <h2 className="text-xl font-bold border-b border-white/10 pb-2 mt-8 mb-4 flex items-center gap-2">
                        <Zap className="text-yellow-500 w-5 h-5" /> Triple-Stream Vault Monitor
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-[#050505] border border-green-500/30 p-5 rounded-2xl">
                            <h3 className="text-xs text-green-500 font-bold uppercase tracking-widest mb-1">Admin Income (10%)</h3>
                            <p className="text-3xl font-black text-green-400">{balancesObj.adminIncome.toFixed(2)} <span className="text-xs font-bold text-green-500/50">NXS</span></p>
                            <p className="text-[10px] text-slate-500 mt-2">Risk-free guaranteed profit.</p>
                        </div>
                        <div className="bg-[#050505] border border-blue-500/30 p-5 rounded-2xl">
                            <h3 className="text-xs text-blue-500 font-bold uppercase tracking-widest mb-1">Active Payout Pool (75%)</h3>
                            <p className="text-3xl font-black text-blue-400">{balancesObj.activePool.toFixed(2)} <span className="text-xs font-bold text-blue-500/50">NXS</span></p>
                            <p className="text-[10px] text-slate-500 mt-2">Fund for user winnings.</p>
                            <form onSubmit={handleSeedVault} className="mt-4 flex gap-2">
                                <input type="number" value={seedAmount} onChange={e => setSeedAmount(e.target.value)} placeholder="Seed Capital" className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs" />
                                <button type="submit" className="bg-blue-600 px-3 py-1 text-xs font-bold rounded hover:bg-blue-500">Seed</button>
                            </form>
                        </div>
                        <div className="bg-[#050505] border border-purple-500/30 p-5 rounded-2xl">
                            <h3 className="text-xs text-purple-500 font-bold uppercase tracking-widest mb-1">Interest Fund (15%)</h3>
                            <p className="text-3xl font-black text-purple-400">{balancesObj.userInterest.toFixed(2)} <span className="text-xs font-bold text-purple-500/50">NXS</span></p>
                            <p className="text-[10px] text-slate-500 mt-2">Safety net for abnormal wins.</p>
                        </div>
                    </div>

                    {/* RISK CONTROL SETTINGS */}
                    <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl mt-8">
                        <h2 className="text-lg font-bold mb-6 flex items-center justify-between">
                            <span className="flex items-center gap-2"><Settings className="w-5 h-5 text-indigo-400" /> Risk Control Parameters</span>
                            <button onClick={handleSaveConfig} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2">
                                <Save className="w-4 h-4" /> Save Constraints
                            </button>
                        </h2>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-widest">Single Game Hard-Stop (Max Payout)</label>
                                <input type="number" value={configEdits.hardStopLimit} onChange={e => setConfigEdits({...configEdits, hardStopLimit: Number(e.target.value)})} className="w-full bg-black/50 border border-slate-700 rounded-lg p-3 text-lg font-mono focus:border-indigo-500 outline-none" />
                                <p className="text-[10px] text-slate-500 pt-1">The absolutely maximum allowed win from a single spin/scratch.</p>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-amber-500 mb-1 uppercase tracking-widest">Tight Mode Pool Threshold</label>
                                <input type="number" value={configEdits.tightModeThreshold} onChange={e => setConfigEdits({...configEdits, tightModeThreshold: Number(e.target.value)})} className="w-full bg-black/50 border border-amber-500/30 rounded-lg p-3 text-lg font-mono focus:border-amber-500 outline-none" />
                                <p className="text-[10px] text-amber-500/70 pt-1">If Active Pool drops below this, high multipliers are mathematically disabled.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-pink-500 mb-1 uppercase tracking-widest flex items-center justify-between">
                                    <span>House Edge Modifier (%)</span>
                                    <span className="font-mono text-lg">{configEdits.houseEdge}%</span>
                                </label>
                                <input type="range" min="1" max="99" value={configEdits.houseEdge} onChange={e => setConfigEdits({...configEdits, houseEdge: Number(e.target.value)})} className="w-full accent-pink-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                                <p className="text-[10px] text-pink-500/70 pt-1">Scales RNG against the player. Higher = lower win probability. Default: 10%.</p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-6">
                    
                    {/* SYSTEM STATS */}
                    <div className="bg-slate-900 border border-slate-700 p-5 rounded-2xl">
                        <h3 className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-4">Wagered vs Payouts</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <span className="text-sm font-medium text-slate-300">Total Wagered In</span>
                                <span className="font-mono font-bold text-emerald-400 flex items-center"><ArrowUpRight className="w-3 h-3 mr-1" />{(statsObj.totalBetsIn || 0).toFixed(2)} NXS</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <span className="text-sm font-medium text-slate-300">Total Payouts Out</span>
                                <span className="font-mono font-bold text-rose-400 flex items-center"><ArrowDownRight className="w-3 h-3 mr-1" />{(statsObj.totalPayoutsOut || 0).toFixed(2)} NXS</span>
                            </div>
                            <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                                <span className="text-xs font-bold text-slate-400 uppercase">Gross Profit</span>
                                <span className={`font-black tracking-wider ${netPlatform >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{netPlatform >= 0 ? '+' : ''}{netPlatform.toFixed(2)} NXS</span>
                            </div>
                        </div>
                    </div>

                    {/* EMERGENCY ACTIONS */}
                    <div className="bg-red-950/20 border border-red-500/30 p-5 rounded-2xl">
                        <h3 className="text-sm text-red-500 font-bold uppercase tracking-widest mb-4 flex items-center gap-2"><PowerOff className="w-4 h-4" /> Emergency Area</h3>
                        <div className="space-y-3">
                            <button onClick={toggleKillSwitch} className={`w-full py-4 rounded-xl font-black uppercase tracking-widest shadow-lg transition-all ${configEdits.isEnabled ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/30 border border-red-400' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/30 border border-emerald-400'}`}>
                                {configEdits.isEnabled ? 'Initiate Kill Switch' : 'Restore Game Engine'}
                            </button>
                            <button onClick={flushCache} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs border border-white/5">
                                <RefreshCw className="w-4 h-4" /> Flush Memory Cache
                            </button>
                        </div>
                        <p className="text-[10px] text-red-400/70 mt-3 text-center leading-relaxed">Kill switch immediately rejects all new bets and halts matchmaking. Flush memory abruptly cancels pending game loops.</p>
                    </div>

                    {/* LIVE ACTIVITY FEED */}
                    <div className="bg-slate-900 border border-slate-700 p-5 rounded-2xl h-[400px] flex flex-col">
                        <h3 className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-emerald-500" /> System Activity Log
                        </h3>
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {feed.length === 0 ? (
                                <p className="text-xs text-slate-500 text-center mt-10">Listening for activity...</p>
                            ) : (
                                feed.map((item, idx) => (
                                    <div key={idx} className="bg-black/50 p-2 rounded border border-white/5 whitespace-nowrap overflow-hidden text-ellipsis">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[9px] text-slate-500 font-mono">{new Date(item.timestamp).toLocaleTimeString()}</span>
                                            <span className={`text-[9px] font-black px-1 rounded uppercase ${Number(item.payout) > 500 ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-slate-400'}`}>
                                                Win: ${item.payout}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-300">{item.event}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
