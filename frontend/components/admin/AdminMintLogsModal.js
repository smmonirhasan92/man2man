import { useState, useEffect } from 'react';
import { X, Search, ChevronLeft, ChevronRight, Activity, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';
import api from '../../services/api';

export default function AdminMintLogsModal({ onClose }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const fetchLogs = async (currentPage) => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/mint-logs?page=${currentPage}&limit=15`);
            setLogs(res.data.logs || []);
            setTotalPages(res.data.totalPages || 1);
            setPage(res.data.currentPage || 1);
            setTotalRecords(res.data.totalRecords || 0);
        } catch (error) {
            console.error('Error fetching mint logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(page);
    }, [page]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="w-full max-w-4xl bg-slate-900 border border-slate-700/50 shadow-2xl rounded-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Activity className="text-blue-400 w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-wide">System Minting Ledger</h2>
                            <p className="text-xs text-slate-400 font-mono">Total Recorded Operations: {totalRecords}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition">
                        <X size={20} />
                    </button>
                </div>

                {/* Table Content */}
                <div className="flex-1 overflow-auto p-5">
                    {loading && logs.length === 0 ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center text-slate-500 py-10">
                            No minting or manual adjustments recorded yet.
                        </div>
                    ) : (
                        <div className="w-full overflow-x-auto rounded-xl border border-slate-800">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-slate-800">
                                        <th className="p-4">Process Date</th>
                                        <th className="p-4">Target User</th>
                                        <th className="p-4">Action Type</th>
                                        <th className="p-4 text-right">Amount (NXS)</th>
                                        <th className="p-4">Note / Justification</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => {
                                        const isCredit = log.amount > 0;
                                        return (
                                            <tr key={log._id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition group">
                                                <td className="p-4">
                                                    <div className="text-xs text-slate-300 font-mono">
                                                        {new Date(log.createdAt).toLocaleDateString()}
                                                    </div>
                                                    <div className="text-[10px] text-slate-500">
                                                        {new Date(log.createdAt).toLocaleTimeString()}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-xs font-bold text-white flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] uppercase border border-slate-700">
                                                            {log.userId?.username?.charAt(0) || '?'}
                                                        </div>
                                                        {log.userId?.username || 'Unknown'}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {isCredit ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider border border-blue-500/20">
                                                            <TrendingUp size={12} /> Mint / Credit
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-wider border border-red-500/20">
                                                            <TrendingDown size={12} /> Burn / Debit
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className={`text-sm font-mono font-black ${isCredit ? 'text-blue-400' : 'text-red-400'}`}>
                                                        {isCredit ? '+' : ''}{log.amount.toLocaleString()} ৳
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 flex items-center justify-end gap-1 mt-0.5">
                                                        {log.balanceBefore} <ArrowRightLeft size={8} /> {log.balanceAfter}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-xs text-slate-400 line-clamp-1 max-w-[200px]" title={log.description}>
                                                        {log.description || "System Administration"}
                                                    </span>
                                                    <div className="text-[9px] text-slate-600 font-mono mt-0.5" title={log.transactionId}>
                                                        # {log.transactionId}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer Pagination */}
                <div className="flex justify-between items-center p-4 border-t border-slate-800 bg-slate-900/50 rounded-b-2xl">
                    <div className="text-xs text-slate-500 font-mono">
                        Page {page} of {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page === 1 || loading}
                            onClick={() => setPage(page - 1)}
                            className="p-1.5 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-50 transition"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            disabled={page === totalPages || loading}
                            onClick={() => setPage(page + 1)}
                            className="p-1.5 bg-slate-800 text-slate-300 rounded hover:bg-slate-700 disabled:opacity-50 transition"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
