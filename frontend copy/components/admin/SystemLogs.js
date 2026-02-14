import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Terminal, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function SystemLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            // Ensure backend has GET /api/admin/logs (It does in adminRoutes.js -> adminController.getAuditLogs)
            const { data } = await api.get('/admin/logs');
            setLogs(data);
        } catch (err) {
            console.error("Failed to fetch logs", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden shadow-xl">
            {/* Header */}
            <div className="bg-gray-900/80 p-4 flex justify-between items-center border-b border-white/5">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <Terminal size={18} className="text-yellow-500" />
                    System Logs & Security Audit
                </h3>
                <button
                    onClick={fetchLogs}
                    className={`p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition ${loading ? 'animate-spin' : ''}`}
                >
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* Console View */}
            <div className="p-4 h-[400px] overflow-y-auto font-mono text-xs space-y-2 bg-black/90">
                {logs.length > 0 ? logs.map((log, i) => (
                    <div key={i} className="flex gap-3 border-b border-white/5 pb-2 last:border-0 hover:bg-white/5 p-1 rounded transition">
                        <span className="text-slate-500 min-w-[130px]">{new Date(log.timestamp).toLocaleString()}</span>
                        <span className={`uppercase font-bold ${log.level === 'error' ? 'text-red-500' : (log.level === 'warn' ? 'text-orange-400' : 'text-emerald-400')}`}>
                            [{log.level || 'INFO'}]
                        </span>
                        <span className="text-slate-300 break-all">
                            {typeof log.message === 'object' ? JSON.stringify(log.message) : log.message}
                            {log.meta && <span className="text-slate-500 ml-2">{JSON.stringify(log.meta)}</span>}
                        </span>
                    </div>
                )) : (
                    <div className="text-center text-slate-500 py-20 flex flex-col items-center">
                        <ShieldCheck size={48} className="mb-4 opacity-50" />
                        <p>No verified security incidents or logs found.</p>
                        <p className="text-[10px] mt-2 opacity-50">Run internal tests to generate traffic.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
