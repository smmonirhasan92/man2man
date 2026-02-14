'use client';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import Link from 'next/link';
// import Image from 'next/image'; // Assuming we might verify images later, check usage
import { ArrowLeft, Check, X, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';

export default function AdminRequestsPage() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false });

    const fetchRequests = async () => {
        try {
            const res = await api.get('/admin/recharges');
            setRequests(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = (id, action) => {
        setConfirmModal({
            isOpen: true,
            title: action === 'approve' ? 'Approve Request' : 'Reject Request',
            message: `Are you sure you want to ${action} this request?`,
            confirmText: action === 'approve' ? 'Approve' : 'Reject',
            onConfirm: async () => {
                try {
                    await api.post('/admin/deposit-request', { requestId: id, action });
                    fetchRequests();
                    toast.success(`Request ${action}d`);
                    setConfirmModal({ isOpen: false });
                } catch (err) {
                    toast.error('Action failed');
                }
            }
        });
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            <div className="bg-white p-4 flex items-center gap-4 shadow-sm z-10 border-b border-gray-100">
                <Link href="/admin/dashboard" className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft className="w-6 h-6 text-gray-700" /></Link>
                <h1 className="text-lg font-bold text-gray-800">Recharge Requests</h1>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
                {loading ? (
                    <p className="text-center text-gray-500 mt-10">Loading...</p>
                ) : requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <Clock className="w-12 h-12 mb-2 opacity-20" />
                        <p>No pending requests</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {requests.map(req => (
                            <div key={req.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="font-bold text-gray-800">{req.User?.fullName || 'Unknown User'}</p>
                                        <p className="text-xs text-gray-500">{req.User?.phone}</p>
                                    </div>
                                    <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-1 rounded-md uppercase">Pending</span>
                                </div>

                                <div className="bg-gray-50 p-3 rounded-xl mb-4 flex justify-between items-center">
                                    <span className="text-gray-500 text-sm">Amount Requested</span>
                                    <span className="font-bold text-lg text-pink-600">৳ {req.amount}</span>
                                </div>

                                {req.proofImage && (
                                    <div className="mb-4">
                                        <p className="text-xs text-gray-500 mb-1">Proof:</p>
                                        <a href={`https://usaaffiliatemarketing.com/api/${req.proofImage}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs hover:underline truncate block">
                                            View Proof Image
                                        </a>
                                    </div>
                                )}

                                {/* TrxID Section (Priority) */}
                                {req.transactionId && (
                                    <div className="bg-slate-100 p-3 rounded-lg mb-4 border border-slate-200">
                                        <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Transaction ID</p>
                                        <div className="flex justify-between items-center">
                                            <code className="text-sm font-black text-slate-700 select-all">{req.transactionId}</code>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(req.transactionId);
                                                    toast.success('TrxID Copied!');
                                                }}
                                                className="bg-white p-1.5 rounded-md shadow-sm border border-gray-200 text-xs font-bold text-blue-600 hover:bg-blue-50 active:scale-95 transition-all"
                                            >
                                                COPY
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => handleAction(req.id, 'reject')} className="py-3 rounded-xl border border-red-100 text-red-600 font-bold text-sm hover:bg-red-50 transition flex justify-center items-center gap-2">
                                        <X className="w-4 h-4" /> Reject
                                    </button>
                                    <button onClick={() => handleAction(req.id, 'approve')} className="py-3 rounded-xl bg-green-500 text-white font-bold text-sm hover:bg-green-600 transition flex justify-center items-center gap-2 shadow-lg shadow-green-500/20">
                                        <Check className="w-4 h-4" /> Approve
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
            />
        </div>
    );
}
