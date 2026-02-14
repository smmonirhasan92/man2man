import { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Target, DollarSign } from 'lucide-react';
import api from '../../services/api';

export default function GameStatsModal({ userId, username, isOpen, onClose }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && userId) {
            fetchStats();
        }
    }, [isOpen, userId]);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/user/${userId}/game-stats`);
            setStats(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="font-bold text-xl text-slate-800">Game Statistics</h3>
                        <p className="text-sm text-slate-500">Performance for <span className="font-bold text-indigo-600">{username}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
                        <X className="w-6 h-6 text-slate-500" />
                    </button>
                </div>

                {loading ? (
                    <div className="py-20 text-center text-slate-400 font-medium">Loading Statistics...</div>
                ) : stats ? (
                    <div className="space-y-6">
                        {/* Summary Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-2 mb-2 text-slate-500">
                                    <Target className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase">Total Games</span>
                                </div>
                                <p className="text-2xl font-black text-slate-800">{stats.totalGames}</p>
                            </div>
                            <div className={`p-4 rounded-2xl border ${stats.netProfit >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                                <div className={`flex items-center gap-2 mb-2 ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {stats.netProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                    <span className="text-xs font-bold uppercase">Net P/L</span>
                                </div>
                                <p className={`text-2xl font-black ${stats.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                    {stats.netProfit >= 0 ? '+' : ''}{parseFloat(stats.netProfit).toFixed(2)}
                                </p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-2 mb-2 text-slate-500">
                                    <DollarSign className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase">Total Bet</span>
                                </div>
                                <p className="text-xl font-bold text-slate-600">{parseFloat(stats.totalBet).toFixed(2)}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-2 mb-2 text-slate-500">
                                    <DollarSign className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase">Total Won</span>
                                </div>
                                <p className="text-xl font-bold text-slate-600">{parseFloat(stats.totalPayout).toFixed(2)}</p>
                            </div>
                        </div>

                        {/* Recent Games List */}
                        <div>
                            <h4 className="font-bold text-slate-700 mb-4">Recent Games</h4>
                            <div className="space-y-3">
                                {stats.recentGames.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-4">No games played yet.</p>
                                ) : (
                                    stats.recentGames.map(game => (
                                        <div key={game.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] ${game.result === 'win' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                    {game.result === 'win' ? 'W' : 'L'}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-700">Head & Tail</p>
                                                    <p className="text-[10px] text-slate-400">{new Date(game.createdAt).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-bold text-slate-600">Bet: {game.betAmount}</p>
                                                <p className={`text-xs font-bold ${game.result === 'win' ? 'text-green-600' : 'text-red-500'}`}>
                                                    {game.result === 'win' ? `+${game.payout}` : `-${game.betAmount}`}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="py-20 text-center text-red-400 font-medium">Failed to load statistics.</div>
                )}
            </div>
        </div>
    );
}
