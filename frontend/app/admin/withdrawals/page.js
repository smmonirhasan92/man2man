'use client';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Check, X, Clock, Wallet, User } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';

export default function AdminWithdrawals() {
    const [requests, setRequests] = useState([]);
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [selectedAgents, setSelectedAgents] = useState({}); // { [reqId]: agentId }
    const [confirmModal, setConfirmModal] = useState({ isOpen: false });

    useEffect(() => {
        fetchRequests();
        fetchAgents();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/withdrawal/list?status=pending');
            setRequests(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const fetchAgents = async () => {
        try {
            const res = await api.get('/admin/agents'); // Using admin route to get full list
            setAgents(res.data || []);
        } catch (err) {
            console.error("Failed to fetch agents", err);
        }
    };

    const handleAction = (id, status) => {
        const agentId = selectedAgents[id];

        let message = `Are you sure you want to ${status} this request?`;
        if (status === 'completed' && !agentId) {
            message = "No Agent Selected! Are you sure you want to approve without assigning an Agent? (System funds will be used directly)";
        }

        setConfirmModal({
            isOpen: true,
            title: status === 'completed' ? 'Approve Withdrawal' : 'Reject Withdrawal',
            message: message,
            confirmText: status === 'completed' ? 'Approve' : 'Reject',
            onConfirm: async () => {
                setActionLoading(id);
                try {
                    await api.post('/withdrawal/process', {
                        transactionId: id,
                        status: status,
                        adminComment: status === 'completed' ? 'Approved by Admin' : 'Rejected by Admin',
                        agentId: status === 'completed' ? agentId : null
                    });
                    setRequests(requests.filter(r => r.id !== id));
                    toast.success(`Request ${status} successfully`);
                    setConfirmModal({ isOpen: false });
                } catch (err) {
                    toast.error(err.response?.data?.message || 'Action failed');
                } finally {
                    setActionLoading(null);
                }
            }
        });
    };

    const handleAgentSelect = (reqId, agentId) => {
        setSelectedAgents(prev => ({
            ...prev,
            [reqId]: agentId
        }));
    };

    if (loading) return <div className="p-10 text-center">Loading Requests...</div>;

    return (
        <div className="p-6 pb-24 font-sans text-gray-800">
            <h1 className="text-2xl font-bold mb-6 text-slate-800">Withdrawal Requests</h1>

            {requests.length === 0 ? (
                <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                    <p>No pending requests.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map((req) => (
                        <div key={req.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 relative overflow-hidden">
                            {/* Status Indicator */}
                            <div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>

                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">৳ {Math.abs(req.amount).toLocaleString()}</h3>
                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                        <Wallet className="w-3 h-3" /> {req.description}
                                    </p>
                                    {/* [NEW] Delay & Net Payout */}
                                    <div className="mt-1 flex gap-2">
                                        <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold border border-slate-200">
                                            {req.metadata?.deliveryTime || '24h'}
                                        </span>
                                        <span className="text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded text-emerald-700 font-bold border border-emerald-200">
                                            Net: ৳ {(Math.abs(req.amount) - (req.fee || 0)).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-lg">PENDING</span>
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        {new Date(req.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-xl text-sm text-gray-600 font-mono">
                                {req.recipientDetails}
                            </div>

                            <div className="flex items-center gap-2 mt-2">
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                    {req.User?.username?.[0]?.toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-700">{req.User?.fullName}</p>
                                    <p className="text-xs text-gray-500">{req.User?.phone}</p>
                                </div>
                            </div>

                            {/* Agent Selection Dropdown */}
                            <div className="mt-2">
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Assign Agent (for Payout)</label>
                                <div className="relative">
                                    <select
                                        className="w-full p-2 text-sm border border-gray-200 rounded-lg appearance-none bg-white"
                                        value={selectedAgents[req.id] || ''}
                                        onChange={(e) => handleAgentSelect(req.id, e.target.value)}
                                    >
                                        <option value="">-- Select Agent --</option>
                                        {agents.map(agent => (
                                            <option key={agent.id} value={agent.id}>
                                                {agent.username} ({agent.phone}) - Bal: {agent.Wallet?.balance || 0}
                                            </option>
                                        ))}
                                    </select>
                                    <User className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-2 border-t border-gray-100 pt-3">
                                <button
                                    onClick={() => handleAction(req.id, 'completed')}
                                    disabled={actionLoading === req.id}
                                    className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition disabled:opacity-50"
                                >
                                    <Check className="w-4 h-4" /> Approve
                                </button>
                                <button
                                    onClick={() => handleAction(req.id, 'rejected')}
                                    disabled={actionLoading === req.id}
                                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition disabled:opacity-50"
                                >
                                    <X className="w-4 h-4" /> Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {/* Confirmation Modal */}
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
