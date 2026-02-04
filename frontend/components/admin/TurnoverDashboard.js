import React, { useState, useEffect } from 'react';

export default function TurnoverDashboard() {
    const [stats, setStats] = useState({
        totalTurnoverPending: 0,
        totalTurnoverCompleted: 0,
        complianceRate: 0 // % of users meeting requirement
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch stats from backend (Mock for now, needs real endpoint)
        // In a real implementation, we'd add an API endpoint: /api/admin/stats/turnover
        const mockFetch = async () => {
            setLoading(true);
            setTimeout(() => {
                setStats({
                    totalTurnoverPending: 1250000,
                    totalTurnoverCompleted: 450000,
                    complianceRate: 36
                });
                setLoading(false);
            }, 1000);
        };
        mockFetch();
    }, []);

    if (loading) return <div className="p-4 text-white">Loading War Room...</div>;

    return (
        <div className="w-full bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 mb-6 uppercase tracking-widest">
                👑 Royale War Room
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Pending */}
                <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-yellow-500">
                    <div className="text-slate-400 text-sm uppercase">Pending Turnover</div>
                    <div className="text-3xl font-mono text-yellow-500 font-bold">
                        BDT {stats.totalTurnoverPending.toLocaleString()}
                    </div>
                    <div className="text-xs text-yellow-500/50 mt-1">Locked Capital</div>
                </div>

                {/* Total Completed */}
                <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-green-500">
                    <div className="text-slate-400 text-sm uppercase">Completed Turnover</div>
                    <div className="text-3xl font-mono text-green-500 font-bold">
                        BDT {stats.totalTurnoverCompleted.toLocaleString()}
                    </div>
                    <div className="text-xs text-green-500/50 mt-1">Released Capital</div>
                </div>

                {/* Compliance Rate */}
                <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-blue-500">
                    <div className="text-slate-400 text-sm uppercase">Compliance Rate</div>
                    <div className="text-3xl font-mono text-blue-500 font-bold">
                        {stats.complianceRate}%
                    </div>
                    <div className="text-xs text-blue-500/50 mt-1">Users Unlocked</div>
                </div>
            </div>

            {/* Profit Guard Status */}
            <div className="mt-8 bg-red-950/30 p-4 rounded-lg border border-red-500/20">
                <div className="flex justify-between items-center text-red-400 mb-2">
                    <span className="font-bold">PROFIT GUARD</span>
                    <span className="animate-pulse">ACTIVE 🟢</span>
                </div>
                <div className="text-sm text-slate-300">
                    Global RTP Target: <span className="font-bold text-white">70%</span> |
                    Admin Profit: <span className="font-bold text-green-400">30%</span>
                </div>
                <div className="w-full bg-slate-700 h-2 mt-2 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full w-[30%]"></div>
                </div>
            </div>
        </div>
    );
}
