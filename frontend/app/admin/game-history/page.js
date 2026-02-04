'use client';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import Link from 'next/link';
import { History, Search, Calendar, Trophy, XCircle, TrendingUp, Info } from 'lucide-react';
import GameStatsModal from '../../../components/admin/GameStatsModal';

export default function GameHistoryPage() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statsModal, setStatsModal] = useState({ show: false, userId: null, username: '' });

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await api.get('/admin/game-logs');
            setLogs(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log =>
        log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user?.phone?.includes(searchTerm)
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-100 rounded-2xl">
                        <History className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Game History</h1>
                        <p className="text-slate-500">Global log of all games played.</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search User..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">User</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Bet</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Result</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Payout</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500">Loading History...</td></tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500">No games found.</td></tr>
                            ) : (
                                filteredLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4">
                                            <div
                                                onClick={() => setStatsModal({ show: true, userId: log.userId, username: log.user?.name })}
                                                className="cursor-pointer group flex items-center gap-2"
                                                title="View User Stats (Profit/Loss)"
                                            >
                                                <div>
                                                    <div className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors flex items-center gap-1">
                                                        {log.user?.name || 'Unknown'}
                                                        <Info className="w-3 h-3 text-slate-300 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all" />
                                                    </div>
                                                    <div className="text-xs text-slate-400 font-mono">{log.user?.phone}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right font-mono font-bold text-slate-600">
                                            ৳{parseFloat(log.betAmount).toFixed(2)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${log.result === 'win' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {log.result === 'win' ? <Trophy className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                                {log.result}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-mono font-bold">
                                            {parseFloat(log.payout) > 0 ? (
                                                <span className="text-green-600">+৳{parseFloat(log.payout).toFixed(2)}</span>
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right text-xs text-slate-500 font-mono">
                                            {new Date(log.createdAt).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <GameStatsModal
                isOpen={statsModal.show}
                onClose={() => setStatsModal({ show: false, userId: null, username: '' })}
                userId={statsModal.userId}
                username={statsModal.username}
            />
        </div>
    );
}
