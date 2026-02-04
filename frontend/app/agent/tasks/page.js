'use client';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { ArrowLeft, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AgentTasksPage() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [note, setNote] = useState('');

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await api.get('/transactions/assigned');
            setTasks(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const openCompleteModal = (taskId) => {
        setSelectedTaskId(taskId);
        setNote('');
        setShowModal(true);
    };

    const handleConfirmComplete = async () => {
        try {
            if (!note) return toast.error("Please enter a Transaction ID or Note");

            await api.post('/transactions/complete',
                { transactionId: selectedTaskId, status: 'completed', comment: note }
            );

            setShowModal(false);
            toast.success('Task Completed! Commission Credited.');
            fetchTasks();
        } catch (err) {
            console.error(err);
            toast.error('Failed to complete task');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            {/* Header */}
            <div className="bg-emerald-600 text-white p-6 rounded-b-[2rem] shadow-lg mb-6 flex items-center gap-4 sticky top-0 z-10">
                <Link href="/agent/dashboard" className="p-2 bg-white/10 backdrop-blur-md rounded-xl hover:bg-white/20 transition">
                    <ArrowLeft className="w-5 h-5 text-white" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-xl font-bold">Pending Tasks</h1>
                    <p className="text-emerald-100 text-xs">Manage assigned transfers</p>
                </div>
                <button onClick={fetchTasks} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            {/* Task List */}
            <div className="px-5 space-y-4">
                {loading ? (
                    <div className="text-center py-12 text-slate-400">Loading tasks...</div>
                ) : tasks.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <span className="text-3xl">✨</span>
                        </div>
                        <h3 className="text-slate-800 font-bold mb-1">All Caught Up!</h3>
                        <p className="text-slate-400 text-sm px-6">No tasks assigned right now.</p>
                    </div>
                ) : (
                    tasks.map(task => (
                        <div key={task.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 relative overflow-hidden group">
                            {/* Details similar to Dashboard but focused on Action */}
                            <div className="flex justify-between items-start mb-4">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${task.type === 'send_money' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                                    {task.type.replace('_', ' ')}
                                </span>
                                <span className="text-2xl font-black text-slate-800 tracking-tight">৳{Math.abs(task.amount)}</span>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                                <p className="text-xs text-slate-500 mb-1">Send to:</p>
                                <p className="font-bold text-slate-800 text-lg break-all">{task.recipientDetails}</p>
                            </div>

                            <button
                                onClick={() => openCompleteModal(task.id)}
                                className="w-full py-4 bg-emerald-600 active:bg-emerald-700 text-white rounded-2xl font-bold text-sm tracking-wide shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 transition"
                            >
                                Mark as Done <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Complete Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Complete Task</h3>
                        <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Enter TrxID / Note"
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl mb-6 outline-none focus:ring-2 focus:ring-emerald-500"
                            autoFocus
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setShowModal(false)} className="py-3 bg-slate-100 font-bold rounded-xl text-slate-600">Cancel</button>
                            <button onClick={handleConfirmComplete} className="py-3 bg-emerald-600 font-bold rounded-xl text-white">Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
