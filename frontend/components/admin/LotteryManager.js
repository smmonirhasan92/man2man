'use client';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Trophy, Plus, Wallet, Target, Zap } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import ConfirmationModal from '../ui/ConfirmationModal';
import toast from 'react-hot-toast';

export default function LotteryManager() {
    // 5x Profit Model State
    const [activeSlot, setActiveSlot] = useState(null);
    const [history, setHistory] = useState([]);
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

    // Create Form
    const [prizeAmount, setPrizeAmount] = useState('');
    const [multiplier, setMultiplier] = useState(5);
    const [loading, setLoading] = useState(false);

    const { formatMoney } = useCurrency(); // Assuming this hook exists or we format manually

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [statusRes, historyRes] = await Promise.all([
                api.get('/lottery/active'),
                api.get('/lottery/history')
            ]);

            if (statusRes.data.status !== 'INACTIVE') {
                setActiveSlot(statusRes.data);
            } else {
                setActiveSlot(null);
            }
            setHistory(historyRes.data);

        } catch (e) { console.error(e); }
    };

    const createSlot = async () => {
        if (!prizeAmount) return toast.error('Enter Prize Amount');
        setLoading(true);
        try {
            await api.post('/lottery/admin/create', {
                prize: prizeAmount,
                multiplier: multiplier
            });
            toast.success('5x Profit Slot Launched!');
            setPrizeAmount('');
            loadData();
        } catch (e) { toast.error(e.response?.data?.message || 'Error'); }
        finally { setLoading(false); }
    };

    const forceDraw = async () => {
        setModal({
            isOpen: true,
            title: 'Force Draw?',
            message: 'This will bypass the sales target and pick a winner immediately.',
            onConfirm: async () => {
                try {
                    await api.post('/lottery/admin/draw');
                    toast.success('Draw Initiated!');
                    loadData();
                } catch (e) { toast.error(e.response?.data?.message || 'Error'); }
            }
        });
    };

    return (
        <div className="p-6 bg-slate-900 text-white rounded-xl space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <Trophy className="text-yellow-400" /> V2 Lottery Manager (5x Profit)
            </h2>

            {/* CREATION PANEL */}
            {!activeSlot ? (
                <div className="bg-slate-800 p-6 rounded-xl border border-white/5 space-y-4">
                    <h3 className="font-bold text-lg text-emerald-400 flex items-center gap-2">
                        <Zap className="w-5 h-5" /> Launch New 5x Slot
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs text-slate-400">Prize Amount (BDT)</label>
                            <input className="bg-slate-900 border border-slate-700 p-3 rounded-lg w-full focus:border-emerald-500 outline-none"
                                type="number" placeholder="e.g. 10000"
                                value={prizeAmount}
                                onChange={e => setPrizeAmount(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-slate-400">Profit Multiplier (Default 5x)</label>
                            <input className="bg-slate-900 border border-slate-700 p-3 rounded-lg w-full focus:border-emerald-500 outline-none"
                                type="number"
                                value={multiplier}
                                onChange={e => setMultiplier(e.target.value)} />
                        </div>
                    </div>

                    <div className="bg-slate-900/50 p-3 rounded text-xs text-slate-400 flex justify-between">
                        <span>Target Sales: ৳{prizeAmount ? prizeAmount * multiplier : 0}</span>
                        <span>Profit: ৳{prizeAmount ? (prizeAmount * multiplier) - prizeAmount : 0}</span>
                    </div>

                    <button
                        onClick={createSlot}
                        disabled={loading}
                        className="bg-emerald-500 hover:bg-emerald-600 px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition disabled:opacity-50 w-full justify-center"
                    >
                        <Plus className="w-5 h-5" /> {loading ? 'Launching...' : 'LAUNCH SLOT'}
                    </button>
                </div>
            ) : (
                <div className="bg-slate-800 p-6 rounded-xl border border-yellow-500/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                        ACTIVE
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <h4 className="text-slate-400 text-xs uppercase tracking-widest">Current Jackpot</h4>
                            <div className="text-4xl font-black text-yellow-400">৳{activeSlot.jackpot}</div>
                            <div className="text-xs text-slate-500 mt-1">Target Sales: ৳{activeSlot.targetSales}</div>
                        </div>

                        <div className="flex-1 w-full">
                            <div className="flex justify-between text-xs text-slate-300 mb-1">
                                <span>Progress</span>
                                <span>{activeSlot.progress.toFixed(1)}%</span>
                            </div>
                            <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-white/5 relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-500" style={{ width: `${activeSlot.progress}%` }}></div>
                            </div>
                            <div className="text-center text-[10px] text-slate-500 mt-1">
                                Current Sales: ৳{activeSlot.currentSales}
                            </div>
                        </div>

                        <button
                            onClick={forceDraw}
                            className="bg-red-900/50 hover:bg-red-900/80 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg text-xs font-bold"
                        >
                            FORCE DRAW
                        </button>
                    </div>
                </div>
            )}

            {/* History List */}
            <div className="space-y-4">
                <h3 className="font-bold text-lg text-slate-300">Recent Draws</h3>
                {history.map((lot, idx) => (
                    <div key={idx} className="bg-slate-800 p-4 rounded-xl flex justify-between items-center border border-white/5 opacity-75">
                        <div>
                            <p className="text-white font-bold">Winner: {lot.winner}</p>
                            <p className="text-xs text-slate-500">{new Date(lot.date).toLocaleString()}</p>
                        </div>
                        <div className="text-emerald-400 font-mono font-bold">
                            +৳{lot.amount}
                        </div>
                    </div>
                ))}
            </div>
            </div>

            <ConfirmationModal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                onConfirm={modal.onConfirm}
                title={modal.title}
                message={modal.message}
                confirmText="Proceed"
            />
        </div >
    );
}
