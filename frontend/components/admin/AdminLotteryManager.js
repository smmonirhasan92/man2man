'use client';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Ticket, Trophy, Target, AlertTriangle, Play, Pause, Plus, Trash, Users, RefreshCw, Zap, Clock, Crown } from 'lucide-react';
import { socket } from '../../services/socket';
import ConfirmationModal from '../ui/ConfirmationModal';
import toast from 'react-hot-toast';

export default function AdminLotteryManager() {
    const [activeSlots, setActiveSlots] = useState([]);
    const [loading, setLoading] = useState(false);

    // Create Form State
    const [prizes, setPrizes] = useState([
        { name: 'Grand Jackpot', amount: 5000, winnersCount: 1, id: 1 },
        { name: '2nd Prize', amount: 1000, winnersCount: 2, id: 2 }
    ]);
    // [HYBRID] New States
    const [drawType, setDrawType] = useState('SALES_BASED');
    const [startTime, setStartTime] = useState(new Date(Date.now() + 60000).toISOString().slice(0, 16));
    const [endTime, setEndTime] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
    const [ticketPrice, setTicketPrice] = useState(20);
    const [targetWinnerId, setTargetWinnerId] = useState('');
    const [lockDraw, setLockDraw] = useState(false);
    const [description, setDescription] = useState('');

    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
    const [manualWinnerTargets, setManualWinnerTargets] = useState({}); // Stores targetWinnerId per slot row

    useEffect(() => {
        fetchStatus();

        socket.on('LOTTERY_UPDATE', fetchStatus);
        socket.on('LOTTERY_DRAW_START', fetchStatus);

        return () => {
            socket.off('LOTTERY_UPDATE', fetchStatus);
            socket.off('LOTTERY_DRAW_START', fetchStatus);
        }
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await api.get('/lottery/active');
            // Handle array or single object response
            if (Array.isArray(res.data)) {
                setActiveSlots(res.data);
            } else if (res.data && res.data.status && res.data.status !== 'INACTIVE') {
                setActiveSlots([res.data]);
            } else {
                setActiveSlots([]);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const addPrizeTier = () => setPrizes([...prizes, { name: 'New Prize', amount: 500, winnersCount: 1, id: Date.now() }]);
    const removePrizeTier = (id) => setPrizes(prizes.filter(p => p.id !== id));
    const updatePrize = (id, field, value) => setPrizes(prizes.map(p => p.id === id ? { ...p, [field]: value } : p));

    const totalPrizeBudget = prizes.reduce((sum, p) => sum + (p.amount * p.winnersCount), 0);

    const [editingSlotId, setEditingSlotId] = useState(null);
    const [editingTierName, setEditingTierName] = useState(null);

    const createLottery = async () => {
        confirmAction(
            editingSlotId ? 'Update Lottery?' : 'Launch Lottery?',
            `Total Budget: ${totalPrizeBudget} TK`,
            async () => {
                setLoading(true);
                try {
                    const payload = {
                        prizes: prizes.map(({ name, amount, winnersCount }) => ({ name, amount, winnersCount })),
                        description,
                        lockDrawUntilTargetMet: lockDraw,
                        drawType,
                        startTime: drawType === 'TIME_BASED' ? new Date(startTime).toISOString() : new Date().toISOString(),
                        endTime: drawType === 'TIME_BASED' ? new Date(endTime).toISOString() : null,
                        ticketPrice,
                        targetWinnerId: targetWinnerId || undefined
                    };

                    if (editingSlotId) {
                        await api.put(`/lottery/admin/${editingSlotId}`, payload);
                        toast.success('Slot Updated!');
                        setEditingSlotId(null);
                    } else {
                        await api.post('/lottery/admin/create', payload);
                        toast.success('Lottery Launched!');
                    }
                    fetchStatus();
                } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
                setLoading(false);
            }
        );
    };

    const startEdit = (slot) => {
        setEditingSlotId(slot.slotId);
        setEditingTierName(slot.tier);
        setPrizes(slot.prizes || []);
        setDescription(slot.description || '');
        setLockDraw(slot.lockDrawUntilTargetMet || false);
        // Calculate buffer roughly or just leave as is since buffer isn't stored directly in slot usually, only targetSales. 
        // But for editing just prizes/desc, it's fine.
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingSlotId(null);
        setEditingTierName(null);
        setPrizes([{ name: 'Grand Jackpot', amount: 5000, winnersCount: 1, id: 1 }]);
        setDescription('');
        setDrawType('SALES_BASED');
        setTargetWinnerId('');
    };

    const confirmAction = (title, message, action) => {
        setModal({
            isOpen: true,
            title,
            message,
            onConfirm: action
        });
    };

    const forceDraw = async (slotId) => {
        const winnerId = manualWinnerTargets[slotId] || null;
        confirmAction(
            `FORCE DRAW for Slot ${slotId}?`,
            winnerId ? `This will FORCE User ${winnerId} to win 1st Prize.` : "This will pick a random winner immediately.",
            async () => {
                setLoading(true);
                try {
                    await api.post('/lottery/admin/draw', { slotId, winnerId: winnerId || undefined });
                    toast.success('Draw Started & Finalized!');
                    fetchStatus();
                } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
                setLoading(false);
            }
        );
    };

    const deleteSlot = async (id) => {
        confirmAction(
            "DELETE SLOT?",
            "This action is irreversible.",
            async () => {
                setLoading(true);
                try {
                    await api.delete(`/lottery/admin/${id}`);
                    toast.success("Deleted");
                    fetchStatus();
                } catch (e) { toast.error(e.message); }
                setLoading(false);
            }
        );
    };

    const nukeAll = async () => {
        confirmAction(
            "⚠️ NUKE ALL LOTTERIES? ⚠️",
            "This will DELETE ALL active slots immediately.",
            async () => {
                setLoading(true);
                try {
                    await Promise.all(activeSlots.map(slot => api.delete(`/lottery/admin/${slot.slotId}`)));
                    toast.success("☢️ All Slots Nuked");
                    fetchStatus();
                } catch (e) { console.error(e); toast.error("Partial Nuke Error"); }
                setLoading(false);
            }
        );
    }

    return (
        <div className="p-4 lg:p-8 space-y-8 w-full min-h-screen font-sans">

            {/* 1. GLOBAL HEADER STATS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Active Draws */}
                <div className="bg-[#111] p-6 rounded-xl border border-white/10 relative overflow-hidden">
                    <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Active Draws</h3>
                    <div className="text-3xl font-black text-white flex items-center gap-2">
                        {activeSlots.length} <span className="text-xs font-normal text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Live</span>
                    </div>
                </div>

                {/* Placeholder Stats (Optional) */}
                <div className="bg-[#111] p-6 rounded-xl border border-white/5 opacity-50 hidden lg:block"></div>
                <div className="bg-[#111] p-6 rounded-xl border border-white/5 opacity-50 hidden lg:block"></div>

                <div className="bg-[#111] p-6 rounded-xl border border-white/10 relative overflow-hidden group shadow-[0_0_30px_rgba(234,179,8,0.1)]">

                    {/* Confirmation Modal */}
                    <ConfirmationModal
                        isOpen={modal.isOpen}
                        onClose={() => setModal({ ...modal, isOpen: false })}
                        onConfirm={modal.onConfirm}
                        title={modal.title}
                        message={modal.message}
                        confirmText="Proceed"
                    />
                    <div className="absolute -right-4 -top-4 opacity-20 group-hover:opacity-30 transition rotate-12">
                        <Trophy className="w-32 h-32 text-yellow-500" />
                    </div>
                    <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                        <Crown className="w-4 h-4 text-yellow-500" /> Total Live Revenue
                    </h3>
                    <div className="text-3xl font-black text-white relative z-10 text-right">
                        {(activeSlots.reduce((acc, s) => acc + (s.currentSales || 0), 0)).toLocaleString()} <span className="text-sm text-yellow-500">BDT</span>
                    </div>
                </div>
            </div>

            {/* 2. MAIN GRID: Left (Table/Slots) - Right (Controls) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT COL: ACTIVE SLOTS (66%) */}
                <div className="space-y-6 lg:col-span-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Target className="text-pink-500" /> Live Operations
                        </h2>
                        <div className="flex gap-2">
                            {activeSlots.length > 0 && (
                                <button onClick={nukeAll} className="px-3 py-1 bg-red-600/20 text-red-500 border border-red-600/50 rounded-lg hover:bg-red-600 hover:text-white transition text-xs font-bold uppercase flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> Nuke All
                                </button>
                            )}
                            <button onClick={fetchStatus} className="p-2 hover:bg-white/10 rounded-full transition"><RefreshCw className="w-4 h-4 text-slate-400" /></button>
                        </div>
                    </div>

                    {/* DESKTOP TABLE VIEW */}
                    <div className="hidden lg:block bg-[#111] rounded-xl border border-white/10 overflow-hidden">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-white/5 text-xs uppercase font-bold text-slate-300">
                                <tr>
                                    <th className="p-4">Slot</th>
                                    <th className="p-4">Prize Pool</th>
                                    <th className="p-4 w-1/3">Progress</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Control</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">

                                {activeSlots.length === 0 ? (
                                    <tr><td colSpan="5" className="p-12 text-center opacity-30">No Active Lotteries</td></tr>
                                ) : activeSlots.map((slot, idx) => {
                                    // Simplified Financials
                                    const totalPayout = slot.prizeAmount || slot.jackpot || 0;

                                    return (
                                        <tr key={slot.slotId || idx} className="hover:bg-white/5 transition group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${slot.tier === 'FLASH' ? 'bg-red-500/10 text-red-500' :
                                                        slot.tier === 'HOURLY' ? 'bg-blue-500/10 text-blue-500' :
                                                            'bg-purple-500/10 text-purple-500'
                                                        }`}>
                                                        {slot.tier === 'FLASH' ? <Zap className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white">{slot.tier}</div>
                                                        <div className="text-[10px] font-mono opacity-50">#{slot.slotId.substr(-4)}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="space-y-1 text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <Trophy className="w-3 h-3 text-yellow-500" />
                                                        <span className="text-yellow-500 font-mono font-bold text-sm">৳{totalPayout.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex justify-between text-[10px] mb-1">
                                                    <span className="text-emerald-400 font-mono">৳{(slot.currentSales || 0).toLocaleString()}</span>
                                                    <span className="text-slate-500 font-mono">/ ৳{slot.targetSales.toLocaleString()} Target</span>
                                                </div>
                                                <div className="w-full bg-black h-2 rounded-full overflow-hidden border border-white/5">
                                                    <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 relative" style={{ width: `${slot.progress}%` }}>
                                                        <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-white opacity-50 shadow-[0_0_10px_white]"></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-2">
                                                    <span className={`text-[10px] font-bold px-2 py-1 rounded border w-fit ${slot.status === 'DRAWING' ? 'border-yellow-500/50 text-yellow-500 bg-yellow-500/10 animate-pulse' :
                                                        slot.status === 'PAUSED' ? 'border-red-500/50 text-red-500 bg-red-500/10' :
                                                            'border-emerald-500/50 text-emerald-500 bg-emerald-500/10'
                                                        }`}>
                                                        {slot.status}
                                                    </span>
                                                    {/* STATUS TOGGLE */}
                                                    <button
                                                        onClick={async () => {
                                                            if (!confirm(`Switch status to ${slot.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'}?`)) return;
                                                            try {
                                                                // Toggle between ACTIVE and PAUSED
                                                                // Assuming backend accepts status update via PUT
                                                                // If not, we might need a specific endpoint or this will just update other fields
                                                                // We'll reuse the createLottery logic but purely for status if possible, 
                                                                // or assume force draw / delete are primary. 
                                                                // For now, let's try a direct PUT with existing structure
                                                                const payload = { ...slot, status: slot.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' };
                                                                await api.put(`/lottery/admin/${slot.slotId}`, payload);
                                                                fetchStatus();
                                                            } catch (e) { toast.error("Status Update Failed"); }
                                                        }}
                                                        className="text-[10px] underline text-slate-500 hover:text-white text-left"
                                                    >
                                                        {slot.status === 'ACTIVE' ? 'Disable (Pause)' : 'Enable (Active)'}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex flex-col items-end gap-2 opacity-50 group-hover:opacity-100 transition">
                                                    <input
                                                        type="text"
                                                        placeholder="Secret Winner ID"
                                                        value={manualWinnerTargets[slot.slotId] || ''}
                                                        onChange={(e) => setManualWinnerTargets({ ...manualWinnerTargets, [slot.slotId]: e.target.value })}
                                                        className="w-32 bg-black/50 border border-white/10 rounded px-2 py-1 text-[10px] text-red-400 font-mono focus:border-red-500 transition-colors"
                                                        title="Force a specific user ID to win 1st Prize."
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => forceDraw(slot.slotId)}
                                                            disabled={slot.lockDrawUntilTargetMet && slot.progress < 100}
                                                            className={`p-2 rounded transition ${slot.lockDrawUntilTargetMet && slot.progress < 100 ? 'text-slate-600 cursor-not-allowed' : 'hover:bg-blue-500/20 text-blue-400'}`}
                                                            title={slot.lockDrawUntilTargetMet && slot.progress < 100 ? "Target Not Met" : "Execute Draw"}
                                                        >
                                                            <Play className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => startEdit(slot)} className="p-2 bg-blue-900/40 hover:bg-blue-600 border border-blue-500/50 text-blue-200 rounded transition" title="Edit Prizes"><Zap className="w-4 h-4" /></button>
                                                        <button onClick={() => deleteSlot(slot.slotId)} className="p-2 hover:bg-red-500/20 text-red-400 rounded"><Trash className="w-4 h-4" /></button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* MOBILE CARD VIEW (Visible only on < lg) */}
                    <div className="lg:hidden space-y-4">
                        {activeSlots.map(slot => (
                            <div key={slot.slotId} className="bg-[#111] p-4 rounded-xl border border-white/10 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${slot.tier === 'FLASH' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                            {slot.tier === 'FLASH' ? <Zap className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-lg">{slot.tier} DRAW</div>
                                            <div className="text-yellow-500 font-mono font-bold">{slot.jackpot.toLocaleString()} TK</div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] bg-white/5 px-2 py-1 rounded border border-white/10">{slot.status}</span>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs text-slate-500">
                                        <span>Progress</span>
                                        <span className="text-white">{Math.round(slot.progress)}%</span>
                                    </div>
                                    <div className="w-full bg-black h-2 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500" style={{ width: `${slot.progress}%` }}></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <button onClick={() => forceDraw(slot.slotId)} className="bg-blue-600/20 text-blue-400 py-3 rounded-lg font-bold text-sm flex justify-center gap-2"><Play className="w-4 h-4" /> Force Draw</button>
                                    <button onClick={() => deleteSlot(slot.slotId)} className="bg-red-600/20 text-red-400 py-3 rounded-lg font-bold text-sm flex justify-center gap-2"><Trash className="w-4 h-4" /> Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT COL: CREATOR & ACTIONS (33%) */}
                <div className="space-y-6 lg:col-span-4">
                    <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/10 sticky top-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="w-full space-y-2">
                                <h3 className={`font-bold uppercase tracking-widest flex items-center gap-2 ${editingSlotId ? 'text-yellow-500' : 'text-white'}`}>
                                    <Plus className="w-4 h-4" /> {editingSlotId ? 'Editing Active Slot' : 'Creator'}
                                </h3>

                                {/* MANDATORY SLOT SELECTOR */}
                                <select
                                    className="w-full bg-black/50 border border-white/20 rounded p-2 text-xs text-white"
                                    value={editingSlotId || ''}
                                    onChange={(e) => {
                                        const slot = activeSlots.find(s => s.slotId === e.target.value);
                                        if (slot) startEdit(slot);
                                        else cancelEdit();
                                    }}
                                >
                                    <option value="">-- Select Target Lottery Slot --</option>
                                    {activeSlots.map(s => (
                                        <option key={s.slotId} value={s.slotId}>
                                            {s.tier} (#{s.slotId.substr(-4)}) - {s.status}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {editingSlotId && (
                                <button onClick={cancelEdit} className="text-xs text-red-500 hover:underline ml-2">Cancel</button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {/* [HYBRID] Draw Settings */}
                            <div className="bg-white/5 p-4 rounded-lg border border-white/5 space-y-3">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase">Draw Type</label>
                                    <select
                                        value={drawType}
                                        onChange={(e) => setDrawType(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded p-2 text-xs text-white mt-1"
                                    >
                                        <option value="SALES_BASED">Sales Based (Progress Bar)</option>
                                        <option value="TIME_BASED">Time Based (Countdown Clock)</option>
                                    </select>
                                </div>

                                {drawType === 'TIME_BASED' && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-xs text-slate-500 uppercase">Start Time</label>
                                            <input
                                                type="datetime-local"
                                                value={startTime}
                                                onChange={(e) => setStartTime(e.target.value)}
                                                className="w-full bg-black/50 border border-blue-500/30 focus:border-blue-500 rounded p-2 text-xs text-blue-400 mt-1"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 uppercase">End Time</label>
                                            <input
                                                type="datetime-local"
                                                value={endTime}
                                                onChange={(e) => setEndTime(e.target.value)}
                                                className="w-full bg-black/50 border border-red-500/30 focus:border-red-500 rounded p-2 text-xs text-red-400 mt-1"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="text-xs text-slate-500 uppercase">Ticket Price (TK)</label>
                                    <input
                                        type="number"
                                        value={ticketPrice}
                                        onChange={(e) => setTicketPrice(Number(e.target.value))}
                                        className="w-full bg-black/50 border border-white/10 rounded p-2 text-xs text-white mt-1 font-mono text-yellow-500 font-bold"
                                        min="1"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-slate-500 uppercase flex justify-between items-center">
                                        <span>Secret Target Winner ID</span>
                                        <span className="text-[9px] bg-red-500/20 text-red-500 px-1 rounded">OPTIONAL</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 64a8v9... (Mongo User ID)"
                                        value={targetWinnerId}
                                        onChange={(e) => setTargetWinnerId(e.target.value)}
                                        className="w-full bg-black/50 border border-red-500/30 focus:border-red-500 rounded p-2 text-xs text-red-400 mt-1 font-mono transition-colors"
                                    />
                                    {targetWinnerId && <p className="text-[10px] text-red-500 mt-1">⚠️ IMPORTANT: This user will be forced to win 1st Prize if they buy a ticket.</p>}
                                </div>
                            </div>

                            {/* Manual Editor */}
                            <div className="space-y-2">
                                <label className="text-xs text-slate-500 uppercase">Prize Structure</label>
                                {prizes.map((p, i) => (
                                    <div key={p.id || i} className="flex gap-2">
                                        <input value={p.amount} onChange={e => updatePrize(p.id, 'amount', e.target.value)} className="w-20 bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-yellow-500 font-mono" />
                                        <input value={p.name} onChange={e => updatePrize(p.id, 'name', e.target.value)} className="flex-1 bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white" />
                                        <button onClick={() => removePrizeTier(p.id)} className="text-red-500 hover:text-red-400"><Trash className="w-3 h-3" /></button>
                                    </div>
                                ))}
                                <button onClick={addPrizeTier} className="w-full py-2 border border-dashed border-white/20 text-slate-500 text-xs rounded hover:bg-white/5">+ Add Prize Tier</button>
                            </div>

                            <div className="flex items-center gap-2 bg-white/5 p-3 rounded-lg cursor-pointer" onClick={() => setLockDraw(!lockDraw)}>
                                <div className={`w-10 h-6 rounded-full relative transition ${lockDraw ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${lockDraw ? 'left-5' : 'left-1'}`}></div>
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-white">Loss Protection</div>
                                    <div className="text-[10px] text-slate-400">Lock Draw until Target Met</div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/10">
                                <div className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/5 mb-4">
                                    <span className="text-slate-400 text-xs">Total Prize Amount:</span>
                                    <span className="text-yellow-500 font-bold font-mono">{totalPrizeBudget.toLocaleString()} TK</span>
                                </div>
                                <button
                                    onClick={createLottery}
                                    disabled={loading}
                                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest rounded-xl transition flex items-center justify-center gap-2"
                                >
                                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                                    {editingSlotId ? 'Update Active Slot' : 'Launch Lottery'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

function RocketIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
            <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 5.46-2.65 8.35A22 22 0 0 1 15 12z" />
        </svg>
    )
}
