import { useState, useEffect } from 'react';
import axios from 'axios';
import ApprovalModal from './admin/ApprovalModal';
import TransactionCard from './admin/TransactionCard';
import api from '../services/api';
import Link from 'next/link';
import { useNotification } from '../context/NotificationContext';
import ConfirmationModal from './ui/ConfirmationModal';

export default function TransactionApproval() {
    const { showSuccess, showError } = useNotification();
    const [transactions, setTransactions] = useState([]);
    const [agents, setAgents] = useState([]);
    const [selectedAgent, setSelectedAgent] = useState({});
    const [loading, setLoading] = useState(true);

    // Modal State
    const [approvalModal, setApprovalModal] = useState({ show: false, transactionId: null, type: null });
    const [bonusAmount, setBonusAmount] = useState('');
    const [adminComment, setAdminComment] = useState('');
    const [receivedAgent, setReceivedAgent] = useState('');
    const [confirmModal, setConfirmModal] = useState({ isOpen: false });

    useEffect(() => {
        fetchTransactions();
        fetchAgents();
    }, []);

    const fetchTransactions = async () => {
        try {
            // Updated Endpoint
            const res = await api.get('/transactions/pending');
            setTransactions(res.data);
        } catch (err) {
            console.error(err);
            showError('Admin Panel Error: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const fetchAgents = async () => {
        try {
            // Using new agent controller endpoint
            const res = await api.get('/admin/agents');
            setAgents(res.data);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleAssign = async (transactionId) => {
        const agentId = selectedAgent[transactionId];
        if (!agentId) return showError('Please select an agent');

        try {
            await api.post('/transactions/assign', { transactionId, agentId });
            showSuccess('Assigned to Agent!');
            fetchTransactions();
        } catch (err) {
            console.error(err);
            showError('Failed to assign');
        }
    };

    const openApprovalModal = (transaction) => {
        setApprovalModal({ show: true, transactionId: transaction._id, type: transaction.recipientDetails?.includes('Method:') ? 'mobile' : 'bank' });
        setBonusAmount('');
        setAdminComment('');
        setReceivedAgent('');
    };

    const submitApproval = async () => {
        try {
            await api.post('/transactions/complete', {
                transactionId: approvalModal.transactionId,
                status: 'completed',
                comment: adminComment || 'Admin Approved',
                bonusAmount,
                receivedByAgentId: receivedAgent
            });
            showSuccess('Transaction Approved!');
            setApprovalModal({ show: false, transactionId: null, type: null });
            fetchTransactions();
        } catch (err) {
            console.error(err);
            showError('Failed to approve: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleAgentSelect = (trxId, agentId) => {
        setSelectedAgent(prev => ({ ...prev, [trxId]: agentId }));
    };

    const handleReject = (transaction) => {
        setConfirmModal({
            isOpen: true,
            title: 'Reject Transaction',
            message: 'Are you sure you want to REJECT this transaction?',
            onConfirm: async () => {
                try {
                    await api.post('/transactions/complete', {
                        transactionId: transaction._id,
                        status: 'rejected',
                        comment: 'Admin Rejected'
                    });
                    showSuccess('Transaction Rejected!');
                    fetchTransactions();
                    setConfirmModal({ isOpen: false });
                } catch (err) {
                    console.error(err);
                    showError('Failed to reject');
                }
            }
        });
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-slate-400 font-medium">Loading requests...</p>
        </div>
    );

    return (
        <div className="pb-20 flex justify-center">

            <div className="w-full max-w-2xl space-y-5 px-4 md:px-0">
                {transactions.length === 0 ? (
                    <div className="py-20 text-center bg-white/50 backdrop-blur-xl rounded-[2.5rem] border border-white/50 shadow-sm">
                        <div className="w-20 h-20 bg-gradient-to-tr from-slate-100 to-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <span className="text-3xl grayscale opacity-50">🎉</span>
                        </div>
                        <h3 className="text-slate-800 font-bold text-lg">All Caught Up!</h3>
                        <p className="text-slate-400 text-sm mt-2">No pending transactions to review.</p>
                    </div>
                ) : (
                    transactions.map(trx => (
                        <TransactionCard
                            key={trx._id}
                            trx={trx}
                            agents={agents}
                            selectedAgentId={selectedAgent[trx._id]}
                            onSelectAgent={handleAgentSelect}
                            onAssign={handleAssign}
                            onApprove={openApprovalModal}
                            onReject={handleReject}
                        />
                    ))
                )}
            </div>

            <ApprovalModal
                show={approvalModal.show}
                onClose={() => setApprovalModal({ show: false, transactionId: null })}
                onConfirm={submitApproval}
                bonusAmount={bonusAmount}
                setBonusAmount={setBonusAmount}
                adminComment={adminComment}
                setAdminComment={setAdminComment}
                receivedAgent={receivedAgent}
                setReceivedAgent={setReceivedAgent}
                agents={agents}
            />

            <div className="fixed bottom-6 right-6 z-20">
                <Link href="/admin/history" className="bg-white text-slate-600 px-6 py-3 rounded-full shadow-lg font-bold border border-slate-200 hover:bg-slate-50 transition flex items-center gap-2">
                    <span>📜 View History</span>
                </Link>
            </div>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText="Reject Transaction"
            />
        </div>
    );
}
