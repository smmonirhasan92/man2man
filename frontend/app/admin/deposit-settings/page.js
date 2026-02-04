'use client';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Save, Plus, Trash2, ArrowLeft, Smartphone } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';

export default function DepositSettingsPage() {
    const [agents, setAgents] = useState([]);
    const [depositNumbers, setDepositNumbers] = useState([]); // [{ number: '...', agentId: 1, agentName: '...' }]
    const [loading, setLoading] = useState(true);

    // Form State
    const [newNumber, setNewNumber] = useState('');
    const [selectedAgentId, setSelectedAgentId] = useState('');
    const [editIndex, setEditIndex] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [agentsRes, settingsRes] = await Promise.all([
                api.get('/admin/agents'),
                api.get('/admin/deposit-settings')
            ]);
            setAgents(agentsRes.data);
            setDepositNumbers(settingsRes.data.deposit_agents || []);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddNumber = () => {
        if (!newNumber || !selectedAgentId) return toast.error('Please enter number and select agent');

        const agent = agents.find(a => a.id === parseInt(selectedAgentId));
        if (!agent) return;

        if (editIndex !== null) {
            // Update Existing
            const updated = [...depositNumbers];
            updated[editIndex] = {
                number: newNumber,
                agentId: agent.id,
                agentName: agent.fullName
            };
            setDepositNumbers(updated);
            setEditIndex(null);
        } else {
            // Add New
            const updated = [...depositNumbers, {
                number: newNumber,
                agentId: agent.id,
                agentName: agent.fullName
            }];
            setDepositNumbers(updated);
        }

        setNewNumber('');
        setSelectedAgentId('');
    };

    const handleEdit = (index) => {
        const item = depositNumbers[index];
        setNewNumber(item.number);
        setSelectedAgentId(item.agentId);
        setEditIndex(index);
    };

    const handleRemoveNumber = (index) => {
        setConfirmModal({
            isOpen: true,
            title: 'Remove Number',
            message: 'Are you sure you want to remove this number?',
            confirmText: 'Remove',
            onConfirm: () => {
                const updated = depositNumbers.filter((_, i) => i !== index);
                setDepositNumbers(updated);
                if (editIndex === index) {
                    setEditIndex(null);
                    setNewNumber('');
                    setSelectedAgentId('');
                }
                setConfirmModal({ isOpen: false });
                toast.success('Number removed');
            }
        });
    };

    const handleSave = async () => {
        try {
            await api.post('/admin/deposit-settings', { deposit_agents: depositNumbers });
            toast.success('Settings Saved Successfully!');
        } catch (err) {
            console.error(err);
            toast.error('Failed to save settings');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/dashboard" className="p-3 bg-white hover:bg-slate-100 rounded-xl shadow-sm border border-slate-200 transition">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Deposit Numbers</h1>
                    <p className="text-slate-500 text-sm">Link deposit phone numbers to Agents for auto-accounting.</p>
                </div>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
                <div className="max-w-md mx-auto space-y-4 md:max-w-2xl">
                    {/* Main Configuration Card */}
                    <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100">
                        <h3 className="font-bold text-lg mb-4 text-slate-700">Active Numbers</h3>

                        {/* Add New Form - Responsive Stack */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Add New Number</label>
                            <div className="flex flex-col gap-3">
                                <input
                                    type="text"
                                    placeholder="Wallet Number (017...)"
                                    value={newNumber}
                                    onChange={(e) => setNewNumber(e.target.value)}
                                    className="w-full p-4 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-500 font-mono font-medium text-lg bg-white"
                                />
                                <select
                                    value={selectedAgentId}
                                    onChange={(e) => setSelectedAgentId(e.target.value)}
                                    className="w-full p-4 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-500 font-sans font-medium text-slate-800 bg-white"
                                    style={{ fontFamily: 'sans-serif, system-ui, -apple-system' }}
                                >
                                    <option value="">Select Agent...</option>
                                    {agents.map(a => (
                                        <option key={a.id} value={a.id}>{a.fullName} ({a.phone})</option>
                                    ))}
                                </select>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleAddNumber}
                                        disabled={!newNumber || !selectedAgentId}
                                        className={`flex-1 py-4 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 ${editIndex !== null ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                                            } disabled:opacity-50 disabled:shadow-none`}
                                    >
                                        {editIndex !== null ? (
                                            <><Plus className="w-5 h-5 rotate-45" /> Update Number</>
                                        ) : (
                                            <><Plus className="w-6 h-6" /> Add Number</>
                                        )}
                                    </button>

                                    {editIndex !== null && (
                                        <button
                                            onClick={() => {
                                                setEditIndex(null);
                                                setNewNumber('');
                                                setSelectedAgentId('');
                                            }}
                                            className="px-4 py-4 bg-slate-200 text-slate-500 font-bold rounded-xl hover:bg-slate-300 transition"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* List */}
                        <div className="space-y-3">
                            {depositNumbers.length === 0 ? (
                                <div className="text-center py-10 opacity-50">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Smartphone className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <p className="text-slate-500 font-medium">No numbers added yet.</p>
                                </div>
                            ) : depositNumbers.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-indigo-100 transition group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold shrink-0">
                                            #{(idx + 1).toString().padStart(2, '0')}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="font-mono font-bold text-slate-800 text-lg truncate">{item.number}</p>
                                            <p className="text-xs text-slate-500 truncate">Agent: <span className="font-bold text-indigo-600">{item.agentName}</span></p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEdit(idx)}
                                            className="p-3 text-orange-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition shrink-0"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                        </button>
                                        <button
                                            onClick={() => handleRemoveNumber(idx)}
                                            className="p-3 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition shrink-0"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Floating Save Button Area */}
                    <div className="sticky bottom-4 mx-4">
                        <button
                            onClick={handleSave}
                            className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-3 backdrop-blur-md"
                        >
                            <Save className="w-5 h-5" /> Save Changes
                        </button>
                    </div>
                </div>
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
