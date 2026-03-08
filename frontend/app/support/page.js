'use client';
import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import BottomNav from '../../components/BottomNav';
import { ArrowLeft, Send, MessageCircle, Phone, LifeBuoy, CheckCircle2, Ticket } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function SupportPage() {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Ticket States
    const [myTickets, setMyTickets] = useState([]);
    const [activeTicket, setActiveTicket] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [replying, setReplying] = useState(false);

    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchTickets();
    }, []);

    // Auto-scroll when chatting
    useEffect(() => {
        if (activeTicket) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activeTicket?.messages]);

    const fetchTickets = async () => {
        try {
            const res = await api.get('/support/my-messages');
            setMyTickets(res.data);

            // Auto update active ticket if open
            if (activeTicket) {
                const updated = res.data.find(t => t._id === activeTicket._id);
                if (updated) setActiveTicket(updated);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/support/send', { subject, message });
            toast.success('Ticket created successfully!');
            setSubject('');
            setMessage('');
            fetchTickets();
            // Jump right into the new ticket
            if (res.data.support) setActiveTicket(res.data.support);
        } catch (err) {
            toast.error('Failed to create ticket');
        } finally {
            setLoading(false);
        }
    };

    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim() || !activeTicket) return;

        setReplying(true);
        try {
            const res = await api.post('/support/reply', {
                messageId: activeTicket._id,
                reply: replyText
            });
            setReplyText('');
            // Preemptively append for speed or wait for fetch
            setActiveTicket(res.data.support);
            fetchTickets();
        } catch (err) {
            toast.error('Failed to send message');
        } finally {
            setReplying(false);
        }
    };

    // ===== ACTIVE CHAT VIEW =====
    if (activeTicket) {
        return (
            <div className="flex flex-col h-screen bg-slate-50 font-sans">
                {/* Header */}
                <div className="bg-white px-4 py-4 flex items-center justify-between shadow-sm z-10 sticky top-0 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setActiveTicket(null)} className="p-2 hover:bg-slate-100 rounded-full transition">
                            <ArrowLeft className="w-5 h-5 text-slate-700" />
                        </button>
                        <div>
                            <h1 className="text-base font-bold text-slate-800 line-clamp-1">{activeTicket.subject}</h1>
                            <span className={`text-[10px] uppercase font-bold tracking-wider ${activeTicket.status === 'answered' ? 'text-green-600' : 'text-blue-500'}`}>
                                STATUS: {activeTicket.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {activeTicket.messages?.map((msg, idx) => {
                        const isMe = msg.senderRole === 'user';
                        return (
                            <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                {!isMe && (
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2 flex-shrink-0 mt-auto mb-1 border border-indigo-200">
                                        <LifeBuoy className="w-4 h-4 text-indigo-600" />
                                    </div>
                                )}
                                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isMe ? 'bg-slate-800 text-white rounded-br-none shadow-md' : 'bg-white text-slate-800 rounded-bl-none border border-slate-100 shadow-sm'}`}>
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                    <div className={`text-[9px] mt-1.5 font-medium flex items-center justify-end gap-1 ${isMe ? 'text-slate-400' : 'text-slate-400'}`}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        {isMe && <CheckCircle2 className="w-3 h-3 text-slate-400" />}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {/* Fallback for legacy DB schema displaying top level message string */}
                    {(activeTicket.message && !activeTicket.messages?.length) && (
                        <div className="flex justify-end">
                            <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-slate-800 text-white rounded-br-none shadow-md">
                                <p className="text-sm">{activeTicket.message}</p>
                            </div>
                        </div>
                    )}
                    {(activeTicket.adminReply && !activeTicket.messages?.length) && (
                        <div className="flex justify-start">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2 flex-shrink-0 mt-auto mb-1 border border-indigo-200">
                                <LifeBuoy className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white text-slate-800 rounded-bl-none border border-slate-100 shadow-sm">
                                <p className="text-sm">{activeTicket.adminReply}</p>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="bg-white p-3 border-t border-slate-100">
                    <form onSubmit={handleSendReply} className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800/20 font-medium"
                        />
                        <button
                            type="submit"
                            disabled={!replyText.trim() || replying}
                            className="w-12 h-12 bg-slate-800 text-white rounded-full flex items-center justify-center flex-shrink-0 transition active:scale-95 disabled:bg-slate-300"
                        >
                            {replying ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    // ===== MASTER LIST INBOX VIEW =====
    return (
        <div className="flex flex-col h-screen bg-slate-50 font-sans">
            {/* Header */}
            <div className="bg-white px-6 py-4 flex items-center gap-4 shadow-sm z-10 sticky top-0">
                <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-full transition"><ArrowLeft className="w-6 h-6 text-slate-700" /></Link>
                <h1 className="text-xl font-bold text-slate-800">Help & Support</h1>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 scrollbar-hide">



                {/* Send Message Form */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 mb-8">
                    <h2 className="text-lg font-bold text-slate-800 mb-1">Create Support Ticket</h2>
                    <p className="text-xs font-medium text-slate-400 mb-4">Want to become a Depositor or having issues? Let us know!</p>

                    <form onSubmit={handleCreateTicket} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Subject (e.g. Depositor Access)"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full p-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-slate-800/20 font-bold text-sm text-slate-800"
                            required
                        />
                        <textarea
                            placeholder="Explain your problem clearly..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full p-4 h-32 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-slate-800/20 font-medium text-sm text-slate-700 resize-none"
                            required
                        ></textarea>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-200 active:scale-95 transition flex items-center justify-center gap-2"
                        >
                            {loading ? 'Submitting...' : <><Ticket className="w-5 h-5" /> Open Ticket</>}
                        </button>
                    </form>
                </div>

                {/* Message History */}
                <div>
                    <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-4 ml-2">My Support Tickets</h3>
                    {myTickets.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-[2rem] border border-dashed border-slate-200">
                            <LifeBuoy className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="font-bold text-slate-400">No active tickets.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {myTickets.map(ticket => (
                                <div
                                    key={ticket._id}
                                    onClick={() => setActiveTicket(ticket)}
                                    className="bg-white p-4 flex flex-col gap-2 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md cursor-pointer transition active:scale-[0.98]"
                                >
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-slate-800 text-sm pr-4 line-clamp-1">{ticket.subject}</h4>
                                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold flex-shrink-0 ${ticket.status === 'answered' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{ticket.status}</span>
                                    </div>
                                    <p className="text-xs font-medium text-slate-500 line-clamp-2">
                                        {ticket.messages && ticket.messages.length > 0 ? ticket.messages[ticket.messages.length - 1].text : ticket.message}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-medium">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
            <BottomNav />
        </div>
    );
}
