'use client';
import { useState, useEffect } from 'react';
import api from '../../../../services/api';
import { Check, X, RefreshCw, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettlementsPage() {
    const [settlements, setSettlements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);

    useEffect(() => {
        fetchSettlements();
    }, []);

    const fetchSettlements = async () => {
        try {
            // Re-use pending transactions endpoint but filter by type?
            // Or use dedicated endpoint. Let's use getPendingTransactions with type filter if supported
            // Backend supports ?type=admin_settlement
            const res = await api.get('/transactions/pending?type=admin_settlement');
            setSettlements(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, status) => {
        setProcessing(id);
        try {
            await api.post('/transaction/complete', {
                transactionId: id,
                status: status, // completed or rejected
                comment: `Admin ${status} settlement`
            });
            await fetchSettlements();
            toast.success(`Settlement ${status}`);
        } catch (err) {
            toast.error('Action failed');
        } finally {
            setProcessing(null);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Agent Settlements pending</h1>
                <button onClick={fetchSettlements} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                    <RefreshCw className="w-5 h-5 text-slate-600" />
                </button>
            </div>

            {loading ? <div className="text-center py-10">Loading Requests...</div> : (
                <div className="space-y-4">
                    {settlements.length === 0 ? <p className="text-center text-slate-400">No pending settlements</p> : (
                        settlements.map(trx => (
                            <div key={trx.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-slate-800">{trx.User?.fullName}</span>
                                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold">Agent</span>
                                    </div>
                                    <p className="text-sm text-slate-500">{trx.User?.phone}</p>
                                    <div className="mt-2 bg-slate-50 p-2 rounded-lg text-xs text-slate-600">
                                        {trx.recipientDetails}
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1">{new Date(trx.createdAt).toLocaleString()}</p>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    <span className="text-2xl font-black text-slate-800">৳{Math.abs(parseFloat(trx.amount))}</span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAction(trx.id, 'rejected')}
                                            disabled={processing === trx.id}
                                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleAction(trx.id, 'completed')}
                                            disabled={processing === trx.id}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50"
                                        >
                                            <Check className="w-4 h-4" /> Approve
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
