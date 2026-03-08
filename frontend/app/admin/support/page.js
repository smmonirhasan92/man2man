'use client';
import { useState, useEffect, useRef } from 'react';
import api from '../../../services/api';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Reply, CheckCircle, Search, RefreshCw, Send, CheckCircle2, Ticket, LifeBuoy } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSupportPage() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTicket, setActiveTicket] = useState(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [filter, setFilter] = useState('all'); // all, open, answered, closed

    const chatEndRef = useRef(null);

    useEffect(() => {
        fetchTickets();

        // Auto-refresh interval for live tickets 
        const interval = setInterval(() => {
            fetchTickets(false);
        }, 15000); // 15s polling

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (activeTicket) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activeTicket?.messages]);

    const fetchTickets = async (showLoad = true) => {
        if (showLoad) setLoading(true);
        try {
            const res = await api.get('/support/all');
            setTickets(res.data);

            // Sync active ticket
            if (activeTicket) {
                const updated = res.data.find(t => t._id === activeTicket._id);
                if (updated) setActiveTicket(updated);
            }
        } catch (err) {
            console.error(err);
        } finally {
            if (showLoad) setLoading(false);
        }
    };

    const handleReply = async (e) => {
        e.preventDefault();
        if (!activeTicket || !replyMessage.trim()) return;

        setSending(true);
        try {
            const res = await api.post('/support/reply', {
                messageId: activeTicket._id,
                reply: replyMessage
            });

            // Optimistically update
            setActiveTicket(res.data.support);
            setReplyMessage('');
            fetchTickets(false);
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

            <div className="max-w-7xl mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-6 h-[calc(100vh-100px)]">

                {/* Left Side: Tickets List */}
                <div className={`w-full ${activeTicket ? 'hidden md:flex md:w-1/3' : 'md:w-1/3'} flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative`}>

                    {/* Filters */}
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex gap-2 overflow-x-auto scrollbar-hide shrink-0">
                        {['all', 'open', 'answered', 'closed'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition flex-shrink-0 ${filter === f
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                    : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
                        {loading && tickets.length === 0 ? (
                            <div className="space-y-2 p-2">
                                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-50 rounded-xl animate-pulse"></div>)}
                            </div>
                        ) : filteredTickets.length === 0 ? (
                            <div className="text-center py-20">
                                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-400 font-bold text-sm">No tickets found</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {filteredTickets.map(ticket => (
                                    <div
                                        key={ticket._id}
                                        onClick={() => setActiveTicket(ticket)}
                                        className={`p-4 rounded-xl cursor-pointer transition border-l-4 ${activeTicket?._id === ticket._id ? 'bg-indigo-50 border-indigo-600' : 'bg-white border-transparent hover:bg-slate-50 border-b border-b-slate-100'}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${ticket.status === 'open' ? 'bg-amber-500 animate-pulse' : ticket.status === 'answered' ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                                                <span className="text-[10px] font-bold text-slate-700">{ticket.userId?.fullName || 'User'}</span>
                                            </div>
                                            <span className="text-[9px] text-slate-400 font-medium">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="font-bold text-slate-800 text-xs mb-1 line-clamp-1">{ticket.subject}</h3>
                                        <p className="text-[10px] text-slate-500 line-clamp-1">
                                            {ticket.messages && ticket.messages.length > 0 ? ticket.messages[ticket.messages.length - 1].text : ticket.message}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Active Chat Window */}
                <div className={`w-full ${!activeTicket ? 'hidden md:flex md:items-center md:justify-center md:w-2/3 md:bg-white md:rounded-2xl md:border md:border-slate-200' : 'flex flex-col md:w-2/3 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden'}`}>

                    {!activeTicket ? (
                        <div className="text-center">
                            <Ticket className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <h2 className="text-lg font-bold text-slate-400">Select a Ticket to Reply</h2>
                        </div>
                    ) : (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-slate-100 bg-white flex items-center gap-4 shrink-0">
                                <button className="md:hidden p-2 bg-slate-50 rounded-full" onClick={() => setActiveTicket(null)}>
                                    <ArrowLeft className="w-5 h-5 text-slate-700" />
                                </button>
                                <div>
                                    <h2 className="font-bold text-slate-800 text-sm">{activeTicket.subject}</h2>
                                    <p className="text-xs text-slate-500 flex items-center gap-2">
                                        {activeTicket.userId?.fullName} <span className="text-slate-300">•</span> {activeTicket.userId?.phone}
                                    </p>
                                </div>
                                <div className="ml-auto">
                                    <span className={`px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold uppercase ${activeTicket.status === 'open' ? 'text-amber-600' : 'text-green-600'}`}>
                                        {activeTicket.status}
                                    </span>
                                </div>
                            </div>

                            {/* Messages Container */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                                {activeTicket.messages?.map((msg, idx) => {
                                    const isAdmin = msg.senderRole === 'admin';
                                    return (
                                        <div key={idx} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                            {!isAdmin && (
                                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center mr-2 flex-shrink-0 mt-auto mb-1">
                                                    <span className="text-xs font-bold text-slate-600">U</span>
                                                </div>
                                            )}
                                            <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${isAdmin ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-200' : 'bg-white text-slate-800 rounded-bl-none border border-slate-200 shadow-sm'}`}>
                                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                                <div className={`text-[9px] mt-1.5 font-medium flex items-center justify-end gap-1 ${isAdmin ? 'text-indigo-200' : 'text-slate-400'}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {isAdmin && <CheckCircle2 className="w-3 h-3" />}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {/* Legacy String Fallbacks */}
                                {(activeTicket.message && !activeTicket.messages?.length) && (
                                    <div className="flex justify-start">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center mr-2 flex-shrink-0 mt-auto mb-1">
                                            <span className="text-xs font-bold text-slate-600">U</span>
                                        </div>
                                        <div className="max-w-[75%] rounded-2xl px-4 py-3 bg-white text-slate-800 rounded-bl-none border border-slate-200 shadow-sm">
                                            <p className="text-sm">{activeTicket.message}</p>
                                        </div>
                                    </div>
                                )}
                                {(activeTicket.adminReply && !activeTicket.messages?.length) && (
                                    <div className="flex justify-end">
                                        <div className="max-w-[75%] rounded-2xl px-4 py-3 bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-200">
                                            <p className="text-sm">{activeTicket.adminReply}</p>
                                        </div>
                                    </div>
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Chat Input */}
                            <div className="p-4 border-t border-slate-100 bg-white shrink-0">
                                <form onSubmit={handleReply} className="flex gap-2 relative">
                                    <textarea
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        placeholder="Type an official response..."
                                        className="w-full pl-5 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-2xl h-14 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-sm text-slate-800"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleReply(e);
                                            }
                                        }}
                                    ></textarea>
                                    <button
                                        type="submit"
                                        disabled={!replyMessage.trim() || sending}
                                        className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-600 text-white rounded-xl flex items-center justify-center transition hover:bg-indigo-700 active:scale-95 disabled:bg-slate-300"
                                    >
                                        {sending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                                    </button>
                                </form>
                                <p className="text-[9px] text-slate-400 mt-2 text-center font-medium">Press Enter to send, Shift+Enter for new line.</p>
                            </div>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
}
