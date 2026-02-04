'use client';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import BottomNav from '../../components/BottomNav';
import { ArrowLeft, Send, MessageCircle, Phone, Mail } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function SupportPage() {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [myMessages, setMyMessages] = useState([]);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            const res = await api.get('/support/my-messages');
            setMyMessages(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/support/send', { subject, message });
            setSuccess('Message sent successfully! We will reply soon.');
            setSubject('');
            setMessage('');
            fetchMessages();
        } catch (err) {
            toast.error('Failed to send message');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 font-sans">
            {/* Header */}
            <div className="bg-white px-6 py-4 flex items-center gap-4 shadow-sm z-10 sticky top-0">
                <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-full transition"><ArrowLeft className="w-6 h-6 text-slate-700" /></Link>
                <h1 className="text-xl font-bold text-slate-800">Help & Support</h1>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 scrollbar-hide">

                {/* Quick Contact Options */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <a href="https://wa.me/8801700000000" target="_blank" className="bg-green-50 border border-green-100 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                            <MessageCircle className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-green-700 text-sm">WhatsApp</span>
                    </a>
                    <a href="tel:+8801700000000" className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                            <Phone className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-blue-700 text-sm">Call Us</span>
                    </a>
                </div>

                {/* Send Message Form */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 mb-8">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Send a Message</h2>
                    {success && <div className="bg-green-100 text-green-700 p-3 rounded-xl text-sm mb-4 font-bold text-center">{success}</div>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="text"
                            placeholder="Subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full p-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-pink-500/20 font-medium"
                            required
                        />
                        <textarea
                            placeholder="Write your message here..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full p-4 h-32 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-pink-500/20 font-medium resize-none"
                            required
                        ></textarea>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-pink-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-pink-200 active:scale-95 transition flex items-center justify-center gap-2"
                        >
                            {loading ? 'Sending...' : <><Send className="w-5 h-5" /> Send Message</>}
                        </button>
                    </form>
                </div>

                {/* Message History */}
                <div>
                    <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-4 ml-2">Recent Tickets</h3>
                    {myMessages.length === 0 ? (
                        <p className="text-center text-slate-400 text-sm py-4">No messages yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {myMessages.map(msg => (
                                <div key={msg.id} className="bg-white p-4 rounded-2xl border border-slate-100">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-slate-700 text-sm">{msg.subject}</h4>
                                        <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${msg.status === 'replied' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{msg.status}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-2">{msg.message}</p>
                                    {msg.adminReply && (
                                        <div className="bg-slate-50 p-3 rounded-xl border-l-4 border-indigo-500 mt-2">
                                            <p className="text-xs font-bold text-indigo-600 mb-1">Support Team:</p>
                                            <p className="text-xs text-slate-600">{msg.adminReply}</p>
                                        </div>
                                    )}
                                    <p className="text-[10px] text-slate-400 mt-2 text-right">{new Date(msg.createdAt).toDateString()}</p>
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
