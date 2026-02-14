'use client';
import { useState, useEffect } from 'react';
import api from '../../../services/api';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Reply, CheckCircle, Search, RefreshCw, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSupportPage() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [filter, setFilter] = useState('all'); // all, pending, replied

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const res = await api.get('/support/all');
            setTickets(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyingTo || !replyMessage) return;

        setSending(true);
        try {
            await api.post('/support/reply', {
                messageId: replyingTo.id,
                reply: replyMessage
            });

            // Update local state without full reload
            setTickets(tickets.map(t =>
                t.id === replyingTo.id
                    ? { ...t, status: 'replied', adminReply: replyMessage }
                    : t
            ));

            setReplyingTo(null);
            setReplyMessage('');
        } catch (err) {
            toast.error('Failed to send reply');
        } finally {
            setSending(false);
        }
    };

    const filteredTickets = tickets.filter(t => {
        if (filter === 'all') return true;
        return t.status === filter;
    });

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            {/* Header */}
            <div className="bg-white sticky top-0 z-20 shadow-sm border-b border-slate-100 px-4 py-4 md:px-8">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/dashboard" className="p-2.5 hover:bg-slate-100 rounded-xl transition border border-slate-200 text-slate-600">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800">Support Tickets</h1>
                            <p className="text-xs text-slate-500 font-medium">Manage User Queries</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchTickets}
                        className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition active:scale-95 flex items-center gap-2 font-bold text-xs"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        <span className="hidden md:inline">Reload</span>
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">

                {/* Filters */}
                <div className="flex gap-2">
                    {['all', 'pending', 'replied'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition ${filter === f
                                ? 'bg-slate-800 text-white shadow-lg'
                                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Tickets List */}
                {loading && tickets.length === 0 ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-32 bg-white rounded-2xl animate-pulse"></div>
                        ))}
                    </div>
                ) : filteredTickets.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                        <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-400 font-bold">No tickets found</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredTickets.map(ticket => (
                            <div key={ticket.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`w-2 h-2 rounded-full ${ticket.status === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></span>
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{ticket.status}</span>
                                            <span className="text-xs text-slate-300">• {new Date(ticket.createdAt).toLocaleString()}</span>
                                        </div>
                                        <h3 className="font-bold text-slate-800 text-lg">{ticket.subject}</h3>
                                    </div>
                                    {ticket.status === 'replied' ? (
                                        <div className="bg-green-50 text-green-600 p-2 rounded-full">
                                            <CheckCircle className="w-5 h-5" />
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setReplyingTo(ticket)}
                                            className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-indigo-100 transition"
                                        >
                                            <Reply className="w-4 h-4" /> Reply
                                        </button>
                                    )}
                                </div>

                                <div className="bg-slate-50 p-4 rounded-xl mb-4 border border-slate-100">
                                    <div className="flex justify-between text-xs text-slate-400 mb-2">
                                        <span className="font-bold text-slate-600">{ticket.User?.fullName}</span>
                                        <span>{ticket.User?.phone}</span>
                                    </div>
                                    <p className="text-slate-700 text-sm leading-relaxed">{ticket.message}</p>
                                </div>

                                {ticket.adminReply && (
                                    <div className="pl-4 border-l-2 border-green-200 bg-green-50/50 p-3 rounded-r-xl">
                                        <p className="text-xs font-bold text-green-700 mb-1">Admin Reply:</p>
                                        <p className="text-sm text-slate-700">{ticket.adminReply}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Reply Modal */}
            {replyingTo && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">Reply to Ticket</h3>
                                <p className="text-xs text-slate-500">Replying to <span className="font-bold text-slate-700">{replyingTo.User?.fullName}</span></p>
                            </div>
                            <button onClick={() => setReplyingTo(null)} className="p-2 hover:bg-slate-200 rounded-full transition text-slate-500">
                                <span className="sr-only">Close</span>
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleReply} className="p-6">
                            <div className="bg-indigo-50 p-4 rounded-xl mb-6">
                                <p className="text-xs font-bold text-indigo-400 uppercase mb-1">User's Message</p>
                                <p className="text-sm text-slate-700 line-clamp-3 italic">"{replyingTo.message}"</p>
                            </div>

                            <label className="block text-sm font-bold text-slate-700 mb-2">Your Reply</label>
                            <textarea
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                placeholder="Type your response here..."
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl h-32 resize-none focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium mb-6"
                                required
                            ></textarea>

                            <button
                                type="submit"
                                disabled={sending}
                                className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 transition flex items-center justify-center gap-2 disabled:opacity-70"
                            >
                                {sending ? 'Sending...' : <><Send className="w-4 h-4" /> Send Reply</>}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
