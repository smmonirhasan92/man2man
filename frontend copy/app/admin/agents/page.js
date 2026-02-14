'use client';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import Link from 'next/link';
import { ArrowLeft, Plus, User, Edit, Save, X } from 'lucide-react';
import AddAgentModal from '../../../components/admin/AddAgentModal';
import AgentBalanceModal from '../../../components/admin/AgentBalanceModal';
import toast from 'react-hot-toast';

export default function AgentsPage() {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Imports removed from body
    // State removed from here

    // Edit Mode
    const [editingAgent, setEditingAgent] = useState(null);
    const [editCommission, setEditCommission] = useState('');

    const fetchAgents = async () => {
        try {
            const res = await api.get('/admin/agents');
            setAgents(res.data);
            setLoading(false);
            setAgents(res.data);
            setLoading(false);
        } catch (err) {
            if (err.response?.status !== 401) {
                console.error(err);
                const msg = err.response?.data?.message || err.message || 'Failed to fetch agents';
                toast.error(`Error loading agents: ${msg}`);
            }
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgents();
    }, []);

    const handleCreate = async (agentData) => {
        try {
            await api.post('/admin/agent', agentData);
            setShowModal(false);
            fetchAgents();
            toast.success('Agent created successfully!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create agent');
        }
    };

    const handleUpdateCommission = async (agentId) => {
        try {
            await api.put('/admin/agent/commission', { agentId, commissionRate: editCommission });
            setEditingAgent(null);
            fetchAgents();
        } catch (err) {
            toast.error('Failed to update commission');
        }
    };

    const [showBalanceModal, setShowBalanceModal] = useState(false);
    const [balanceForm, setBalanceForm] = useState({ agentId: null });

    const openBalanceModal = (agent) => {
        setBalanceForm({ agentId: agent.id }); // Only need ID, form state is largely internal to modal now
        setShowBalanceModal(true);
    };

    const handleAdjustBalance = async (balanceData) => {
        // [TODO] Modal
        try {
            await api.post('/admin/agent/balance', balanceData);
            setShowBalanceModal(false);
            fetchAgents();
            toast.success('Balance adjusted successfully');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to adjust balance');
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 min-h-screen">
            {/* PWA Header - Admin Edition */}
            <div className="bg-slate-900 text-white p-6 rounded-b-[2rem] shadow-lg mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-pink-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 -ml-20 -mb-20"></div>

                <div className="relative z-10">
                    <div className="flex justify-between items-center mb-6">
                        <Link href="/admin/dashboard" className="p-2 bg-white/10 backdrop-blur-md rounded-xl hover:bg-white/20 transition">
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </Link>
                        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-pink-500 text-white px-4 py-2 rounded-xl backdrop-blur-sm border border-pink-400 font-bold text-sm shadow-lg shadow-pink-500/20 active:scale-95 transition">
                            <Plus className="w-4 h-4" /> Add New
                        </button>
                    </div>

                    <h1 className="text-3xl font-bold mb-1">Agents</h1>
                    <p className="text-slate-400 text-sm">Manage your sales force</p>
                </div>
            </div>

            <div className="p-6 overflow-y-auto pb-32">
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-10 text-slate-400">Loading agents...</div>
                    ) : agents.map(agent => (
                        <div key={agent.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
                            {/* Header: Icon + Name + Phone */}
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center shrink-0">
                                    <User className="w-6 h-6" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-slate-800 text-lg truncate">{agent.fullName}</h3>
                                    <p className="text-sm text-slate-500 font-mono">{agent.phone}</p>
                                </div>
                                <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${agent.kycStatus === 'approved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {agent.kycStatus || 'Pending'}
                                </div>
                            </div>

                            {/* Balance & Stats Section */}
                            <div className="flex flex-col gap-3">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 relative">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Stock</p>
                                    <p className="text-3xl font-black text-slate-800 tracking-tight">৳{agent.Wallet?.balance || 0}</p>
                                    <button
                                        onClick={() => openBalanceModal(agent)}
                                        className="absolute top-4 right-4 text-[10px] bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-full font-bold transition border border-indigo-100"
                                    >
                                        Manage
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-emerald-50/50 p-2 rounded-lg border border-emerald-100 text-center">
                                        <p className="text-[9px] font-bold text-emerald-400 uppercase">Profit</p>
                                        <p className="font-bold text-emerald-700 text-sm">৳{Number(agent.totalEarnings || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100 text-center">
                                        <p className="text-[9px] font-bold text-blue-400 uppercase">Cash In</p>
                                        <p className="font-bold text-blue-700 text-sm">৳{Number(agent.totalDeposits || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-rose-50/50 p-2 rounded-lg border border-rose-100 text-center">
                                        <p className="text-[9px] font-bold text-rose-400 uppercase">Cash Out</p>
                                        <p className="font-bold text-rose-700 text-sm">৳{Number(agent.totalWithdraws || 0).toLocaleString()}</p>
                                    </div>
                                </div>

                                <Link href={`/admin/history?user=${agent.id}`} className="w-full text-center py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition border-t border-slate-100 block">
                                    View Transaction History
                                </Link>
                            </div>

                            {/* Commission Section */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100/50 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Commission Rate</span>
                                    {editingAgent === agent.id ? (
                                        <div className="flex items-center gap-2 mt-1">
                                            <input
                                                type="number"
                                                value={editCommission}
                                                onChange={(e) => setEditCommission(e.target.value)}
                                                className="w-20 p-1 border rounded text-sm font-bold bg-white"
                                                autoFocus
                                            />
                                            <button onClick={() => handleUpdateCommission(agent.id)} className="bg-green-500 text-white p-1 rounded hover:bg-green-600"><Save className="w-4 h-4" /></button>
                                            <button onClick={() => setEditingAgent(null)} className="bg-red-100 text-red-500 p-1 rounded hover:bg-red-200"><X className="w-4 h-4" /></button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xl font-bold text-slate-700">{agent.commissionRate}%</span>
                                            <button onClick={() => { setEditingAgent(agent.id); setEditCommission(agent.commissionRate); }} className="text-slate-400 hover:text-emerald-600 transition">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Username</span>
                                    <span className="text-xs font-medium text-slate-600">{agent.username}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal - Create Agent */}
            <AddAgentModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSubmit={handleCreate}
            />

            {/* Modal - Manage Balance */}
            <AgentBalanceModal
                isOpen={showBalanceModal}
                onClose={() => setShowBalanceModal(false)}
                onSubmit={handleAdjustBalance}
                initialAgentId={balanceForm.agentId}
            />
        </div>
    );
}
