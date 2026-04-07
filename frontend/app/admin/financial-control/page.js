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

        // [FIX] Use centralized robust Socket Service
        const { socket } = require('../../../services/socket');

        if (socket) {
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
    
            // Ensure if socket was already connected, we just emit join
            if (socket.connected) {
                socket.emit('join_admin_room', 'dummy_token');
            }
        }

        // Cleanup listeners to prevent memory leaks on unmount
        return () => {
            if (socket) {
                socket.off('connect');
                socket.off('live_traffic_update');
                socket.off('activity_feed');
            }
        };
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

                    {/* 2. বাজেটিং ও লিমিট (Budget & Limits) */}
                    <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl mt-8">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-cyan-400">
                            ২. বাজেটিং ও লিমিট (Budget & Limits)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="bg-black/50 p-4 rounded-xl border border-slate-800 border-b-cyan-500">
                                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Base Hourly Limit</p>
                                <p className="text-2xl font-mono text-white">33.00 <span className="text-xs text-slate-500">NXS</span></p>
                                <p className="text-[9px] text-slate-500 mt-1">এটি আপনার সেট করা প্রাথমিক বাজেট</p>
                            </div>
                            <div className="bg-black/50 p-4 rounded-xl border border-slate-800 border-b-purple-500">
                                <p className="text-[10px] text-purple-400 font-bold uppercase mb-1">Bonus Budget (Pad)</p>
                                <p className="text-2xl font-mono text-purple-300">{(vault.pad || 0).toFixed(2)} <span className="text-xs text-purple-500/50">NXS</span></p>
                                <p className="text-[9px] text-slate-500 mt-1">ফি থেকে জমানো টাকা যা অটোমেটিক বাড়ছে</p>
                            </div>
                            <div className="bg-emerald-900/20 p-4 rounded-xl border border-emerald-500/30">
                                <p className="text-[10px] text-emerald-400 font-bold uppercase mb-1">Total Playable Limit</p>
                                <p className="text-2xl font-mono text-emerald-400">{(33 + (vault.pad || 0)).toFixed(2)} <span className="text-xs text-emerald-500/50">NXS</span></p>
                                <p className="text-[9px] text-emerald-500/70 mt-1">বর্তমানে এই পরিমাণ টাকা জেতানো সম্ভব</p>
                            </div>
                        </div>
                        <div className="bg-amber-900/20 p-3 rounded-lg border border-amber-500/30 text-[10px] text-amber-200/80">
                            <span className="font-bold text-amber-400">Note:</span> এই বাজেট শেষ হলে সিঙ্গেল প্লেয়াররা আর বড় উইন পাবে না, শুধুমাত্র রিফান্ড পাবে।
                        </div>
                    </div>

                    {/* 3. ফি এবং প্রফিট কন্ট্রোল (Fees & Profit) */}
                    <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl mt-6">
                        <h2 className="text-lg font-bold mb-4 flex items-center justify-between text-pink-400">
                            <span>৩. ফি এবং প্রফিট কন্ট্রোল (Fees & Profit)</span>
                            <button onClick={handleSaveConfig} className="bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2">
                                <Save className="w-4 h-4" /> Save Fee Rule
                            </button>
                        </h2>
                        
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
                                <div className="w-1/2 pr-4 space-y-4">
                                    {/* Single Player Slider */}
                                    <div>
                                        <label className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
                                            <span>Single Player Fee:</span>
                                            <span className="text-pink-400 font-mono text-lg">{configEdits.houseEdge}%</span>
                                        </label>
                                        <input type="range" min="5" max="15" value={configEdits.houseEdge} onChange={e => setConfigEdits({...configEdits, houseEdge: Number(e.target.value)})} className="w-full accent-pink-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer" />
                                        <p className="text-[9px] text-slate-500 mt-1">আপনি এখান থেকে চেঞ্জ করতে পারবেন</p>
                                    </div>
                                </div>
                                <div className="w-1/2 pl-4 border-l border-white/10">
                                    <label className="block text-xs font-bold text-slate-300 mb-1">Multiplayer (P2P) Fee:</label>
                                    <div className="text-2xl font-black text-rose-500 flex items-center gap-2">
                                        15% <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-1 rounded">LOCKED</span>
                                    </div>
                                    <p className="text-[9px] text-slate-500 mt-1 leading-relaxed">এটি পরিবর্তন করা যাবে না কারণ এটি জিরো-বার্ণ নিশ্চিত করে।</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#0B1221] p-4 rounded-xl border border-indigo-500/20 text-center">
                                    <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Admin Share</h4>
                                    <p className="text-xl font-black text-white">50% <span className="text-xs text-slate-500 font-normal">of Fees</span></p>
                                    <p className="text-[9px] text-indigo-500/70 mt-1">সরাসরি আপনার লাভ</p>
                                </div>
                                <div className="bg-[#0B1221] p-4 rounded-xl border border-purple-500/20 text-center">
                                    <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">Injection Share</h4>
                                    <p className="text-xl font-black text-white">50% <span className="text-xs text-slate-500 font-normal">of Fees</span></p>
                                    <p className="text-[9px] text-purple-500/70 mt-1">রি-ইনজেকশন প্যাডে বা বোনাস বাজেটে জমা হবে</p>
                                </div>
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

                    {/* 1. গেমের মেইন সুইচ (The Kill Switch) */}
                    <div className="bg-red-950/20 border border-red-500/30 p-5 rounded-2xl">
                        <h3 className="text-sm text-red-500 font-bold tracking-widest mb-4 flex items-center gap-2"><PowerOff className="w-4 h-4" /> ১. গেমের মেইন সুইচ (The Kill Switch)</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between bg-black/40 p-3 rounded-lg border border-red-500/20">
                                <span className="text-xs text-red-400 font-bold uppercase">Game Status / খেলার অবস্থা</span>
                                <span className={`text-xs font-black px-2 py-1 rounded ${configEdits.isEnabled ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-white'}`}>
                                    [{configEdits.isEnabled ? 'ON' : 'OFF'}]
                                </span>
                            </div>
                            <button onClick={toggleKillSwitch} className={`w-full py-4 rounded-xl font-black uppercase tracking-widest shadow-lg transition-all ${configEdits.isEnabled ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/30 border border-red-400' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/30 border border-emerald-400'}`}>
                                {configEdits.isEnabled ? 'Turn OFF (Emergency Stop)' : 'Turn ON (Restore Engine)'}
                            </button>
                            <button onClick={flushCache} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs border border-white/5">
                                <RefreshCw className="w-4 h-4" /> Flush Memory Cache
                            </button>
                        </div>
                        <p className="text-[10px] text-red-400/70 mt-3 text-center leading-relaxed">Description: এই বাটনটি অফ করলে পুরো গেম ইঞ্জিন সাথে সাথে বন্ধ হয়ে যাবে (Emergency Stop)।</p>
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
