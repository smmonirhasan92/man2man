'use client';
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useSocket } from '../../../hooks/useSocket';
import { Activity } from 'lucide-react';

export default function AdminLiveChart({ initialData }) {
    const socket = useSocket('/system');
    const [data, setData] = useState(initialData || [
        { time: '0m', in: 0, out: 0, net: 0 }
    ]);

    useEffect(() => {
        if (!socket) return;

        // Listen for Global Admin Socket Events for Real-time Charting
        const handleUpdate = (tx) => {
            setData(prev => {
                const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const newPoint = {
                    time: now,
                    in: tx.type.includes('deposit') || tx.type.includes('recharge') ? tx.amount : 0,
                    out: tx.type.includes('withdraw') || tx.type.includes('cash_out') ? tx.amount : 0,
                };
                newPoint.net = newPoint.in - newPoint.out;

                const newData = [...prev, newPoint];
                if (newData.length > 20) newData.shift(); // Keep last 20 points
                return newData;
            });
        };

        // Custom event from backend could be 'admin_live_tx'
        socket.on('admin_live_tx', handleUpdate);

        // Also fallback to generic user updates if we can intercept them (Admin should subscribe to a global room)
        socket.on('wallet:update', (txData) => {
            handleUpdate(txData);
        });

        return () => {
            socket.off('admin_live_tx', handleUpdate);
            socket.off('wallet:update', handleUpdate);
        };
    }, [socket]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 border border-white/10 p-3 rounded-lg shadow-xl shrink-0 text-xs">
                    <p className="text-slate-400 font-mono mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex justify-between gap-4 font-bold" style={{ color: entry.color }}>
                            <span className="uppercase">{entry.name}:</span>
                            <span>৳{entry.value.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-72 bg-[#0f0f0f] border border-white/5 rounded-2xl p-4 relative overflow-hidden group">
            <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Live Transaction Activity</h3>
                <span className="flex h-2 w-2 relative ml-auto">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
            </div>

            <div className="h-full w-full -ml-4">
                <ResponsiveContainer width="100%" height="90%">
                    <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="time" hide />
                        <YAxis hide />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="in" name="Inflow" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorIn)" isAnimationActive={true} />
                        <Area type="monotone" dataKey="out" name="Outflow" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorOut)" isAnimationActive={true} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
